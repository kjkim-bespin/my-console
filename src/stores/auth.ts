import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  signInWithSecret,
  getTokensFromAuthResult,
  completeNewPassword,
  respondToMfaChallenge,
  getUserMfaStatus,
  setupMfaTotp,
  verifyMfaTotp,
  enableMfaPreference
} from '../utils/cognito';
import { extractUserInfo } from '../utils/jwt';

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false);
  const user = ref<any>(null);
  const userInfo = ref<any>(null); // Full user info from GET /api/v1/me
  const loading = ref(false);
  const error = ref<string | null>(null);
  const tokens = ref<any>(null);
  const challengeName = ref<string | null>(null);
  const challengeSession = ref<string | null>(null);
  const pendingUsername = ref<string | null>(null);
  const shouldFetchMe = ref(false);

  // MFA state
  const mfaEnabled = ref(false);
  const mfaDevices = ref<string[]>([]);
  const preferredMfaSetting = ref<string | null>(null);
  const mfaSetupSecret = ref<string | null>(null);
  const mfaSetupSession = ref<string | null>(null);

  async function login(username: string, password: string, fetchMe: boolean = false) {
    loading.value = true;
    error.value = null;
    challengeName.value = null;
    challengeSession.value = null;
    shouldFetchMe.value = fetchMe;

    console.log('=== Login Attempt ===');
    console.log('Username:', username);
    console.log('Fetch Me API:', fetchMe);
    console.log('====================');

    try {
      console.log('Calling signInWithSecret...');
      const result = await signInWithSecret(username, password);
      console.log('SignIn result:', result);

      // Check for challenges
      if (result.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
        console.log('NEW_PASSWORD_REQUIRED challenge detected');
        challengeName.value = result.ChallengeName;
        challengeSession.value = result.Session || null;
        pendingUsername.value = username;
        return result;
      }

      // Check for MFA challenges
      if (result.ChallengeName === 'SMS_MFA' || result.ChallengeName === 'SOFTWARE_TOKEN_MFA') {
        console.log('MFA challenge detected:', result.ChallengeName);
        challengeName.value = result.ChallengeName;
        challengeSession.value = result.Session || null;
        pendingUsername.value = username;
        return result;
      }

      const authTokens = getTokensFromAuthResult(result);
      tokens.value = authTokens;

      if (authTokens.idToken) {
        console.log('User signed in successfully');

        // Extract user info from tokens
        const userInfo = extractUserInfo(authTokens);

        isAuthenticated.value = true;
        user.value = {
          username: username || userInfo.username,
          userId: userInfo.userId,
          email: userInfo.email,
          sub: userInfo.sub,
          tokens: authTokens,
        };

        console.log('User info extracted:', user.value);
      }

      return result;
    } catch (err: any) {
      console.error('=== Login Error ===');
      console.error('Error:', err);
      console.error('Error message:', err.message);
      console.error('Error name:', err.name);
      console.error('==================');
      error.value = err.message || 'Login failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function completeNewPasswordChallenge(newPassword: string) {
    if (!pendingUsername.value || !challengeSession.value) {
      throw new Error('No pending password challenge');
    }

    loading.value = true;
    error.value = null;

    try {
      const result = await completeNewPassword(
        pendingUsername.value,
        newPassword,
        challengeSession.value
      );

      const authTokens = getTokensFromAuthResult(result);
      tokens.value = authTokens;

      if (authTokens.idToken) {
        console.log('Password changed and user signed in successfully');

        // Extract user info from tokens
        const userInfo = extractUserInfo(authTokens);

        isAuthenticated.value = true;
        user.value = {
          username: pendingUsername.value || userInfo.username,
          userId: userInfo.userId,
          email: userInfo.email,
          sub: userInfo.sub,
          tokens: authTokens,
        };

        console.log('User info extracted after password change:', user.value);

        challengeName.value = null;
        challengeSession.value = null;
        pendingUsername.value = null;
      }

      return result;
    } catch (err: any) {
      console.error('Password change error:', err);
      error.value = err.message || 'Password change failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function completeMfaChallenge(mfaCode: string) {
    if (!pendingUsername.value || !challengeSession.value || !challengeName.value) {
      throw new Error('No pending MFA challenge');
    }

    if (challengeName.value !== 'SMS_MFA' && challengeName.value !== 'SOFTWARE_TOKEN_MFA') {
      throw new Error('Invalid MFA challenge type');
    }

    loading.value = true;
    error.value = null;

    try {
      const result = await respondToMfaChallenge(
        pendingUsername.value,
        mfaCode,
        challengeSession.value,
        challengeName.value as 'SMS_MFA' | 'SOFTWARE_TOKEN_MFA'
      );

      const authTokens = getTokensFromAuthResult(result);
      tokens.value = authTokens;

      if (authTokens.idToken) {
        console.log('MFA verified and user signed in successfully');

        // Extract user info from tokens
        const userInfo = extractUserInfo(authTokens);

        isAuthenticated.value = true;
        user.value = {
          username: pendingUsername.value || userInfo.username,
          userId: userInfo.userId,
          email: userInfo.email,
          sub: userInfo.sub,
          tokens: authTokens,
        };

        console.log('User info extracted after MFA verification:', user.value);

        challengeName.value = null;
        challengeSession.value = null;
        pendingUsername.value = null;
      }

      return result;
    } catch (err: any) {
      console.error('MFA verification error:', err);
      error.value = err.message || 'MFA verification failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    try {
      isAuthenticated.value = false;
      user.value = null;
      tokens.value = null;
      console.log('User logged out');
    } catch (err: any) {
      error.value = err.message || 'Logout failed';
      throw err;
    }
  }

  async function checkAuthStatus() {
    try {
      if (tokens.value && tokens.value.idToken) {
        isAuthenticated.value = true;
      } else {
        isAuthenticated.value = false;
        user.value = null;
      }
    } catch (err) {
      isAuthenticated.value = false;
      user.value = null;
    }
  }

  function getIdToken() {
    return tokens.value?.idToken;
  }

  function getAccessToken() {
    return tokens.value?.accessToken;
  }

  async function fetchMfaStatus() {
    const accessToken = getAccessToken();
    if (!accessToken) {
      console.error('No access token available');
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const status = await getUserMfaStatus(accessToken);
      mfaDevices.value = status.userMFASettingList;
      preferredMfaSetting.value = status.preferredMfaSetting || null;
      mfaEnabled.value = status.userMFASettingList.length > 0;

      console.log('MFA status fetched:', {
        enabled: mfaEnabled.value,
        devices: mfaDevices.value,
        preferred: preferredMfaSetting.value,
      });
    } catch (err: any) {
      console.error('Fetch MFA status error:', err);
      error.value = err.message || 'Failed to fetch MFA status';
    } finally {
      loading.value = false;
    }
  }

  async function startMfaSetup() {
    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    loading.value = true;
    error.value = null;

    try {
      const result = await setupMfaTotp(accessToken);
      mfaSetupSecret.value = result.secretCode || null;
      mfaSetupSession.value = result.session || null;

      console.log('MFA setup started');
      return result;
    } catch (err: any) {
      console.error('Start MFA setup error:', err);
      error.value = err.message || 'Failed to start MFA setup';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function verifyAndEnableMfa(userCode: string) {
    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    loading.value = true;
    error.value = null;

    try {
      // Step 1: Verify the TOTP code
      await verifyMfaTotp(accessToken, userCode, mfaSetupSession.value || undefined);

      // Step 2: Enable MFA preference
      await enableMfaPreference(accessToken);

      // Step 3: Update local state
      mfaEnabled.value = true;
      mfaDevices.value = ['SOFTWARE_TOKEN_MFA'];
      preferredMfaSetting.value = 'SOFTWARE_TOKEN_MFA';

      // Clear setup state
      mfaSetupSecret.value = null;
      mfaSetupSession.value = null;

      console.log('MFA enabled successfully');
    } catch (err: any) {
      console.error('Verify and enable MFA error:', err);
      error.value = err.message || 'Failed to enable MFA';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // ============ Permission Helper Functions ============
  /**
   * Check if user is systemadmin
   * systemadmin role is indicated by a special 'systemadmin' role in organizationRoles
   */
  function isSystemAdmin(): boolean {
    if (!userInfo.value || !userInfo.value.organizationRoles) {
      return false;
    }

    // Check if user has systemadmin role in any organization
    return userInfo.value.organizationRoles.some((roleObj: any) =>
      roleObj.role === 'systemadmin'
    );
  }

  /**
   * Check if user is admin in current organization
   */
  function isAdminInCurrentOrg(): boolean {
    if (!userInfo.value || !userInfo.value.organizationRoles) {
      return false;
    }

    const currentOrgId = userInfo.value.recentOrganizationId;
    if (!currentOrgId) {
      return false;
    }

    // Check if user has admin role in current organization
    return userInfo.value.organizationRoles.some((roleObj: any) =>
      roleObj.organizationId === currentOrgId && roleObj.role === 'admin'
    );
  }

  /**
   * Check if user is admin in a specific organization
   */
  function isAdminInOrg(organizationId: string): boolean {
    if (!userInfo.value || !userInfo.value.organizationRoles) {
      return false;
    }

    return userInfo.value.organizationRoles.some((roleObj: any) =>
      roleObj.organizationId === organizationId && roleObj.role === 'admin'
    );
  }

  /**
   * Check if user can manage organizations (systemadmin only)
   */
  function canManageOrganizations(): boolean {
    return isSystemAdmin();
  }

  /**
   * Check if user can manage users (systemadmin or admin)
   */
  function canManageUsers(): boolean {
    return isSystemAdmin() || isAdminInCurrentOrg();
  }

  /**
   * Get user's role in current organization
   */
  function getCurrentOrganizationRole(): string | null {
    if (isSystemAdmin()) {
      return 'systemadmin';
    }

    if (!userInfo.value || !userInfo.value.organizationRoles) {
      return null;
    }

    const currentOrgId = userInfo.value.recentOrganizationId;
    if (!currentOrgId) {
      return null;
    }

    const roleObj = userInfo.value.organizationRoles.find((r: any) =>
      r.organizationId === currentOrgId
    );

    return roleObj ? roleObj.role : null;
  }

  /**
   * Set user info from API
   */
  function setUserInfo(info: any) {
    userInfo.value = info;
  }

  return {
    isAuthenticated,
    user,
    userInfo,
    loading,
    error,
    tokens,
    challengeName,
    challengeSession,
    pendingUsername,
    shouldFetchMe,
    mfaEnabled,
    mfaDevices,
    preferredMfaSetting,
    mfaSetupSecret,
    login,
    logout,
    checkAuthStatus,
    getIdToken,
    getAccessToken,
    completeNewPasswordChallenge,
    completeMfaChallenge,
    fetchMfaStatus,
    startMfaSetup,
    verifyAndEnableMfa,
    setUserInfo,
    isSystemAdmin,
    isAdminInCurrentOrg,
    isAdminInOrg,
    canManageOrganizations,
    canManageUsers,
    getCurrentOrganizationRole,
  };
});
