/**
 * Decode JWT token without verification
 * This is safe for extracting claims from tokens issued by trusted sources
 */
export function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    // Decode the payload (second part)
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Extract user information from Cognito tokens
 */
export function extractUserInfo(tokens: { idToken?: string; accessToken?: string }) {
  const userInfo: any = {
    username: null,
    userId: null,
    email: null,
    sub: null,
  };

  if (tokens.idToken) {
    const idTokenPayload = decodeJWT(tokens.idToken);
    if (idTokenPayload) {
      userInfo.username = idTokenPayload['cognito:username'] || idTokenPayload.username;
      userInfo.email = idTokenPayload.email;
      userInfo.sub = idTokenPayload.sub;
      console.log('ID Token payload:', idTokenPayload);
    }
  }

  if (tokens.accessToken) {
    const accessTokenPayload = decodeJWT(tokens.accessToken);
    if (accessTokenPayload) {
      userInfo.userId = accessTokenPayload.sub || accessTokenPayload.username;
      console.log('Access Token payload:', accessTokenPayload);
    }
  }

  // Use sub as userId if not found in access token
  if (!userInfo.userId && userInfo.sub) {
    userInfo.userId = userInfo.sub;
  }

  return userInfo;
}
