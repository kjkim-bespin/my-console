import { defineStore } from 'pinia';
import { ref } from 'vue';
import { signInWithSecret, getTokensFromAuthResult, completeNewPassword } from '../utils/cognito';
import { extractUserInfo } from '../utils/jwt';

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false);
  const user = ref<any>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const tokens = ref<any>(null);
  const challengeName = ref<string | null>(null);
  const challengeSession = ref<string | null>(null);
  const pendingUsername = ref<string | null>(null);

  async function login(username: string, password: string) {
    loading.value = true;
    error.value = null;
    challengeName.value = null;
    challengeSession.value = null;

    console.log('=== Login Attempt ===');
    console.log('Username:', username);
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

  return {
    isAuthenticated,
    user,
    loading,
    error,
    tokens,
    challengeName,
    challengeSession,
    pendingUsername,
    login,
    logout,
    checkAuthStatus,
    getIdToken,
    getAccessToken,
    completeNewPasswordChallenge,
  };
});
