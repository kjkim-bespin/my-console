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

    <div v-else-if="userInfo" class="info-card">
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
      </div>

      <h2>API 응답 (GET /api/v1/me)</h2>
      <div class="info-section">
        <pre class="api-response">{{ JSON.stringify(userInfo, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';
import {useRouter} from 'vue-router';
import {useAuthStore} from '../stores/auth';
import apiService from '../services/api';

const router = useRouter();
const authStore = useAuthStore();

const userInfo = ref<any>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const tokenCopied = ref(false);

async function fetchUserInfo() {
  loading.value = true;
  error.value = null;

  try {
    userInfo.value = await apiService.getCurrentUser();
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

onMounted(() => {
  fetchUserInfo();
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
</style>
