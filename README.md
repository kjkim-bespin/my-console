# My Console - Vue3 + Cognito + Scarif-HAPI

간단한 Vue3 프로젝트로 AWS Cognito 인증과 scarif-hapi API 연동을 제공합니다.

## 기능

- AWS Cognito를 이용한 사용자 인증 (로그인/로그아웃)
- 로그인한 사용자 정보 표시
- Scarif-HAPI REST API (`GET /api/v1/me`) 호출 및 응답 표시
- 인증 토큰 자동 관리 (Axios interceptor)

## 프로젝트 구조

```
my-console/
├── src/
│   ├── config/
│   │   └── amplify.ts          # AWS Amplify/Cognito 설정
│   ├── services/
│   │   └── api.ts              # Scarif-HAPI API 서비스
│   ├── stores/
│   │   └── auth.ts             # 인증 상태 관리 (Pinia)
│   ├── views/
│   │   ├── LoginView.vue       # 로그인 페이지
│   │   └── DashboardView.vue   # 사용자 정보 대시보드
│   ├── router/
│   │   └── index.ts            # Vue Router 설정
│   ├── App.vue                 # 메인 앱 컴포넌트
│   └── main.ts                 # 앱 진입점
├── .env.example                # 환경 변수 예제
└── package.json
```

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 실제 값으로 수정하세요.

```bash
cp .env.example .env
```

`.env` 파일:
```env
VITE_USER_POOL_ID=your_cognito_user_pool_id
VITE_USER_POOL_CLIENT_ID=your_cognito_user_pool_client_id
VITE_AWS_REGION=ap-northeast-2
VITE_API_BASE_URL=http://localhost:3000
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` (또는 표시된 주소)로 접속합니다.

### 4. 빌드

```bash
npm run build
```

## AWS Cognito 설정

1. AWS Console에서 Cognito User Pool을 생성합니다.
2. App Client를 생성합니다 (Client Secret 없이).
3. User Pool ID와 App Client ID를 `.env` 파일에 입력합니다.

## Scarif-HAPI 연동

- Scarif-HAPI 서버가 `http://localhost:3000`에서 실행되어야 합니다.
- API 엔드포인트: `GET /api/v1/me`
- 인증: Bearer Token (Cognito ID Token)

## 주요 기술 스택

- Vue 3 (Composition API)
- TypeScript
- Vite
- Vue Router 4
- Pinia (상태 관리)
- AWS Amplify (Cognito 인증)
- Axios (HTTP 클라이언트)

## 사용 방법

1. 로그인 페이지에서 Cognito 사용자 계정으로 로그인합니다.
2. 로그인 성공 시 대시보드로 이동합니다.
3. 대시보드에서 Cognito 사용자 정보와 Scarif-HAPI API 응답을 확인할 수 있습니다.
4. 로그아웃 버튼으로 로그아웃할 수 있습니다.

## 참고 사항

- Node.js 버전: 18.x (현재 설치된 버전에서 일부 경고가 발생할 수 있지만 정상 작동합니다)
- Scarif-HAPI 서버가 실행 중이어야 API 호출이 성공합니다.
- CORS 설정이 필요할 수 있습니다 (Scarif-HAPI 서버 설정 확인).
