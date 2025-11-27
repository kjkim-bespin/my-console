import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  GetUserCommand,
  AssociateSoftwareTokenCommand,
  VerifySoftwareTokenCommand,
  SetUserMFAPreferenceCommand
} from '@aws-sdk/client-cognito-identity-provider';
import CryptoJS from 'crypto-js';

const region = import.meta.env.VITE_AWS_REGION || 'ap-northeast-2';
const clientId = import.meta.env.VITE_USER_POOL_CLIENT_ID;
const clientSecret = import.meta.env.VITE_USER_POOL_CLIENT_SECRET;

const client = new CognitoIdentityProviderClient({ region });

/**
 * Calculate SECRET_HASH for Cognito authentication
 */
function calculateSecretHash(username: string): string {
  if (!clientSecret) {
    console.error('Client Secret is missing!');
    console.error('Available env vars:', Object.keys(import.meta.env));
    throw new Error('Client Secret is not configured. Please set VITE_USER_POOL_CLIENT_SECRET in .env file');
  }

  const message = username + clientId;
  const hash = CryptoJS.HmacSHA256(message, clientSecret);
  return CryptoJS.enc.Base64.stringify(hash);
}

/**
 * Sign in with username and password using Cognito Identity Provider SDK
 */
export async function signInWithSecret(username: string, password: string) {
  console.log('=== Cognito Sign In with Secret ===');
  console.log('Username:', username);
  console.log('Client ID:', clientId);
  console.log('Region:', region);
  console.log('Has Client Secret:', !!clientSecret);

  const secretHash = calculateSecretHash(username);
  console.log('SECRET_HASH calculated');

  const command = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: clientId,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
      SECRET_HASH: secretHash,
    },
  });

  try {
    const response = await client.send(command);
    console.log('Sign in successful');
    return response;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

/**
 * Get tokens from authentication result
 */
export function getTokensFromAuthResult(authResult: any) {
  return {
    idToken: authResult.AuthenticationResult?.IdToken,
    accessToken: authResult.AuthenticationResult?.AccessToken,
    refreshToken: authResult.AuthenticationResult?.RefreshToken,
  };
}

/**
 * Complete new password challenge
 */
export async function completeNewPassword(
  username: string,
  newPassword: string,
  session: string
) {
  console.log('=== Complete New Password Challenge ===');
  console.log('Username:', username);

  const secretHash = calculateSecretHash(username);

  const command = new RespondToAuthChallengeCommand({
    ChallengeName: 'NEW_PASSWORD_REQUIRED',
    ClientId: clientId,
    ChallengeResponses: {
      USERNAME: username,
      NEW_PASSWORD: newPassword,
      SECRET_HASH: secretHash,
    },
    Session: session,
  });

  try {
    const response = await client.send(command);
    console.log('Password changed successfully');
    return response;
  } catch (error) {
    console.error('Password change error:', error);
    throw error;
  }
}

/**
 * Respond to MFA challenge (SMS_MFA or SOFTWARE_TOKEN_MFA)
 */
export async function respondToMfaChallenge(
  username: string,
  mfaCode: string,
  session: string,
  challengeName: 'SMS_MFA' | 'SOFTWARE_TOKEN_MFA'
) {
  console.log('=== Respond to MFA Challenge ===');
  console.log('Username:', username);
  console.log('Challenge Name:', challengeName);

  const secretHash = calculateSecretHash(username);

  const command = new RespondToAuthChallengeCommand({
    ChallengeName: challengeName,
    ClientId: clientId,
    ChallengeResponses: {
      USERNAME: username,
      [challengeName === 'SMS_MFA' ? 'SMS_MFA_CODE' : 'SOFTWARE_TOKEN_MFA_CODE']: mfaCode,
      SECRET_HASH: secretHash,
    },
    Session: session,
  });

  try {
    const response = await client.send(command);
    console.log('MFA verification successful');
    return response;
  } catch (error) {
    console.error('MFA verification error:', error);
    throw error;
  }
}

/**
 * Get user's current MFA status
 */
export async function getUserMfaStatus(accessToken: string) {
  console.log('=== Get User MFA Status ===');

  const command = new GetUserCommand({
    AccessToken: accessToken,
  });

  try {
    const response = await client.send(command);
    console.log('User MFA status retrieved');
    return {
      mfaOptions: response.MFAOptions || [],
      userMFASettingList: response.UserMFASettingList || [],
      preferredMfaSetting: response.PreferredMfaSetting,
    };
  } catch (error) {
    console.error('Get user MFA status error:', error);
    throw error;
  }
}

/**
 * Start TOTP MFA setup (get secret code for QR generation)
 */
export async function setupMfaTotp(accessToken: string) {
  console.log('=== Setup MFA TOTP ===');

  const command = new AssociateSoftwareTokenCommand({
    AccessToken: accessToken,
  });

  try {
    const response = await client.send(command);
    console.log('TOTP setup initiated');
    return {
      secretCode: response.SecretCode,
      session: response.Session,
    };
  } catch (error) {
    console.error('Setup MFA TOTP error:', error);
    throw error;
  }
}

/**
 * Verify TOTP code during setup
 */
export async function verifyMfaTotp(accessToken: string, userCode: string, session?: string) {
  console.log('=== Verify MFA TOTP ===');

  const command = new VerifySoftwareTokenCommand({
    AccessToken: accessToken,
    UserCode: userCode,
    Session: session,
  });

  try {
    const response = await client.send(command);
    console.log('TOTP verification successful');
    return response;
  } catch (error) {
    console.error('Verify MFA TOTP error:', error);
    throw error;
  }
}

/**
 * Enable MFA preference (set TOTP as preferred)
 */
export async function enableMfaPreference(accessToken: string) {
  console.log('=== Enable MFA Preference ===');

  const command = new SetUserMFAPreferenceCommand({
    AccessToken: accessToken,
    SoftwareTokenMfaSettings: {
      Enabled: true,
      PreferredMfa: true,
    },
  });

  try {
    const response = await client.send(command);
    console.log('MFA preference enabled');
    return response;
  } catch (error) {
    console.error('Enable MFA preference error:', error);
    throw error;
  }
}
