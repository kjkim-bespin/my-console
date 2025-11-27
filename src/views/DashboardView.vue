<template>
  <div class="dashboard-container">
    <div class="header">
      <h1>사용자 정보</h1>
      <button @click="handleLogout" class="logout-button">로그아웃</button>
    </div>

    <div v-if="loading" class="loading">로딩 중...</div>

    <div v-else-if="error" class="error-card">
      <h3>오류 발생</h3>
      <p>{{ error }}</p>
      <button @click="fetchUserInfo" class="retry-button">다시 시도</button>
    </div>

    <div v-else class="info-card">
      <h2>Cognito 사용자 정보</h2>
      <div class="info-section">
        <div class="info-item">
          <span class="label">사용자명:</span>
          <div class="value-with-copy">
            <span class="value">{{ authStore.user?.username || 'N/A' }}</span>
            <div v-if="authStore.getAccessToken()" class="tooltip-wrapper">
              <button
                @click="copyAccessToken"
                class="copy-icon-button"
                :class="{ copied: tokenCopied }"
              >
                <svg v-if="!tokenCopied" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>
              <span class="tooltip">{{ tokenCopied ? '복사됨!' : 'Access Token 복사' }}</span>
            </div>
          </div>
        </div>
        <div class="info-item">
          <span class="label">User ID (sub):</span>
          <span class="value">{{ authStore.user?.userId || authStore.user?.sub || 'N/A' }}</span>
        </div>
        <div class="info-item" v-if="authStore.user?.email">
          <span class="label">이메일:</span>
          <span class="value">{{ authStore.user.email }}</span>
        </div>
        <div class="info-item">
          <span class="label">MFA 상태:</span>
          <div class="value-with-action">
            <div class="mfa-status">
              <svg v-if="authStore.mfaEnabled" class="status-icon enabled" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <svg v-else class="status-icon disabled" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              <span class="value">{{ authStore.mfaEnabled ? '활성화됨' : '비활성화됨' }}</span>
            </div>
            <button v-if="!authStore.mfaEnabled" @click="openMfaSetup" class="enable-mfa-button" title="MFA 활성화">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>MFA 활성화</span>
            </button>
          </div>
        </div>
      </div>

      <template v-if="authStore.shouldFetchMe">
        <h2>API 응답 (GET /api/v1/me)</h2>
        <div class="info-section">
          <pre v-if="userInfo" class="api-response">{{ JSON.stringify(userInfo, null, 2) }}</pre>
          <div v-else class="no-data">API 호출 결과가 없습니다.</div>
        </div>
      </template>
    </div>

    <!-- MFA Setup Modal -->
    <div v-if="showMfaSetup" class="modal-overlay" @click="closeMfaSetup">
      <div class="modal-content" @click.stop>
        <h2>MFA 활성화</h2>

        <div v-if="!qrCodeUrl" class="loading">QR 코드 생성 중...</div>

        <div v-else class="mfa-setup">
          <p class="setup-instructions">
            Google Authenticator 또는 다른 인증 앱으로 아래 QR 코드를 스캔하세요.
          </p>

          <div class="qr-code-container">
            <img :src="qrCodeUrl" alt="QR Code" class="qr-code" />
          </div>

          <p class="setup-instructions">
            또는 이 코드를 수동으로 입력하세요:
          </p>
          <div class="secret-code">{{ authStore.mfaSetupSecret }}</div>

          <div class="form-group">
            <label for="mfaVerifyCode">인증 코드</label>
            <input
              id="mfaVerifyCode"
              v-model="verifyCode"
              type="text"
              placeholder="6자리 코드 입력"
              maxlength="6"
              pattern="[0-9]{6}"
              autocomplete="off"
            />
            <small class="hint">인증 앱에 표시된 6자리 코드를 입력하세요</small>
          </div>

          <div v-if="mfaSetupError" class="error-message">
            {{ mfaSetupError }}
          </div>

          <div class="modal-actions">
            <button @click="verifyAndEnable" :disabled="loading" class="primary-button">
              {{ loading ? '확인 중...' : '확인 및 활성화' }}
            </button>
            <button @click="closeMfaSetup" :disabled="loading" class="secondary-button">
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref, computed} from 'vue';
import {useRouter} from 'vue-router';
import {useAuthStore} from '../stores/auth';
import apiService from '../services/api';

const router = useRouter();
const authStore = useAuthStore();

const userInfo = ref<any>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const tokenCopied = ref(false);

// MFA setup
const showMfaSetup = ref(false);
const verifyCode = ref('');
const mfaSetupError = ref<string | null>(null);

const qrCodeUrl = computed(() => {
  if (!authStore.mfaSetupSecret) return null;
  const username = authStore.user?.username || authStore.user?.email || 'user';
  const issuer = 'MyConsole';
  const otpauthUrl = `otpauth://totp/${issuer}:${username}?secret=${authStore.mfaSetupSecret}&issuer=${issuer}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;
});

async function fetchUserInfo() {
  // Only fetch if the option is enabled
  if (!authStore.shouldFetchMe) {
    console.log('Skipping /me API call - option disabled');
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    userInfo.value = await apiService.getCurrentUser();
    console.log('Successfully fetched user info from /me API');
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Failed to fetch user info';
    console.error('Error fetching user info:', err);
  } finally {
    loading.value = false;
  }
}

async function handleLogout() {
  try {
    await authStore.logout();
    await router.push('/login');
  } catch (error) {
    console.error('Logout error:', error);
  }
}

async function copyAccessToken() {
  try {
    const token = authStore.getAccessToken();
    if (!token) {
      console.error('No access token available');
      return;
    }

    await navigator.clipboard.writeText(token);
    tokenCopied.value = true;

    // Reset the copied state after 2 seconds
    setTimeout(() => {
      tokenCopied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy access token:', err);
  }
}

async function openMfaSetup() {
  mfaSetupError.value = null;
  verifyCode.value = '';

  try {
    await authStore.startMfaSetup();
    showMfaSetup.value = true;
  } catch (err: any) {
    mfaSetupError.value = err.message || 'MFA 설정을 시작할 수 없습니다.';
    console.error('Open MFA setup error:', err);
  }
}

function closeMfaSetup() {
  showMfaSetup.value = false;
  verifyCode.value = '';
  mfaSetupError.value = null;
}

async function verifyAndEnable() {
  mfaSetupError.value = null;

  if (!/^[0-9]{6}$/.test(verifyCode.value)) {
    mfaSetupError.value = '6자리 숫자 코드를 입력해주세요.';
    return;
  }

  try {
    await authStore.verifyAndEnableMfa(verifyCode.value);
    closeMfaSetup();
    // Optionally show success message
    alert('MFA가 성공적으로 활성화되었습니다!');
  } catch (err: any) {
    mfaSetupError.value = err.message || 'MFA 활성화에 실패했습니다. 코드를 확인하고 다시 시도해주세요.';
    console.error('Verify and enable MFA error:', err);
  }
}

onMounted(() => {
  fetchUserInfo();
  authStore.fetchMfaStatus();
});
</script>

<style scoped>
.dashboard-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
  background: #f7fafc;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

h1 {
  color: #2d3748;
  margin: 0;
}

.logout-button {
  padding: 0.75rem 1.5rem;
  background: #e53e3e;
  color: white;
  border: none;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.logout-button:hover {
  background: #c53030;
}

.loading {
  text-align: center;
  padding: 3rem;
  font-size: 1.2rem;
  color: #718096;
}

.error-card {
  background: #fff5f5;
  border: 1px solid #feb2b2;
  border-radius: 10px;
  padding: 2rem;
  text-align: center;
}

.error-card h3 {
  color: #e53e3e;
  margin-top: 0;
}

.error-card p {
  color: #742a2a;
  margin-bottom: 1.5rem;
}

.retry-button {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.retry-button:hover {
  background: #5568d3;
}

.info-card {
  background: white;
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

h2 {
  color: #2d3748;
  margin-top: 0;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e2e8f0;
}

.info-section {
  margin-bottom: 2rem;
}

.info-item {
  display: flex;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
}

.info-item:last-child {
  border-bottom: none;
}

.label {
  font-weight: 600;
  color: #4a5568;
  min-width: 150px;
  text-align: left;
}

.value {
  color: #2d3748;
  flex: 1;
  text-align: left;
}

.api-response {
  background: #f7fafc;
  padding: 1rem;
  border-radius: 5px;
  border: 1px solid #e2e8f0;
  overflow-x: auto;
  font-size: 0.9rem;
  line-height: 1.5;
  text-align: left;
  white-space: pre-wrap;
  word-break: break-word;
}

.no-data {
  padding: 2rem;
  text-align: center;
  color: #718096;
  font-size: 0.9rem;
}

.value-with-copy {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.tooltip-wrapper {
  position: relative;
  display: inline-flex;
}

.copy-icon-button {
  padding: 0.4rem;
  background: transparent;
  color: #667eea;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.copy-icon-button:hover {
  background: #f7fafc;
  color: #5568d3;
  border-color: #667eea;
  transform: scale(1.1);
}

.copy-icon-button.copied {
  color: #48bb78;
  border-color: #48bb78;
  background: #f0fff4;
}

.copy-icon-button.copied:hover {
  color: #38a169;
  border-color: #38a169;
}

.tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #2d3748;
  color: white;
  font-size: 0.75rem;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s;
  pointer-events: none;
  z-index: 10;
}

.tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: #2d3748;
}

.tooltip-wrapper:hover .tooltip {
  opacity: 1;
  visibility: visible;
}

.value-with-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  gap: 1rem;
}

.mfa-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-icon {
  flex-shrink: 0;
}

.status-icon.enabled {
  color: #48bb78;
}

.status-icon.disabled {
  color: #a0aec0;
}

.enable-mfa-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.enable-mfa-button:hover {
  background: #5568d3;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  text-align: center;
}

.mfa-setup {
  text-align: center;
}

.setup-instructions {
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.6;
}

.qr-code-container {
  display: flex;
  justify-content: center;
  margin: 1.5rem 0;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 8px;
}

.qr-code {
  max-width: 200px;
  height: auto;
}

.secret-code {
  background: #f7fafc;
  padding: 1rem;
  border-radius: 5px;
  font-family: 'Courier New', monospace;
  font-size: 1.1rem;
  letter-spacing: 0.1rem;
  margin: 1rem 0 1.5rem;
  word-break: break-all;
}

.form-group {
  margin-bottom: 1.5rem;
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
  text-align: center;
  letter-spacing: 0.3rem;
  font-family: 'Courier New', monospace;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.form-group .hint {
  display: block;
  margin-top: 0.5rem;
  color: #888;
  font-size: 0.85rem;
  text-align: center;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.primary-button {
  flex: 1;
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.primary-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.primary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.secondary-button {
  flex: 1;
  padding: 0.75rem;
  background: #e2e8f0;
  color: #4a5568;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.secondary-button:hover:not(:disabled) {
  background: #cbd5e0;
}

.secondary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
