import { Amplify } from 'aws-amplify';

console.log(process.env.VITE_AWS_COGNITO_DOMAIN)
// Cognito 설정
export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.VITE_USER_POOL_ID || 'YOUR_USER_POOL_ID',
      userPoolClientId: process.env.VITE_USER_POOL_CLIENT_ID || 'YOUR_USER_POOL_CLIENT_ID',
      region: process.env.VITE_AWS_REGION || 'ap-northeast-2',
      endpoint: process.env.VITE_AWS_COGNITO_DOMAIN || 'https://cognito-idp.ap-northeast-2.amazonaws.com/',
    }
  }
};

export function configureAmplify() {
  Amplify.configure(amplifyConfig);
  console.log('Amplify configured successfully');
}
