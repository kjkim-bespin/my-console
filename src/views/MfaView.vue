<template>
  <div class="mfa-container">
    <div class="mfa-card">
      <h1>MFA 인증</h1>
      <p class="info-message">
        {{ getMfaMessage() }}
      </p>

      <form @submit.prevent="handleMfaSubmit">
        <div class="form-group">
          <label for="mfaCode">인증 코드</label>
          <input
            id="mfaCode"
            v-model="mfaCode"
            type="text"
            placeholder="6자리 인증 코드를 입력하세요"
            required
            maxlength="6"
            pattern="[0-9]{6}"
            autocomplete="off"
          />
          <small class="hint">{{ authStore.challengeName === 'SMS_MFA' ? 'SMS로 전송된' : '인증 앱에 표시된' }} 6자리 코드를 입력하세요</small>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" :disabled="loading" class="submit-button">
          {{ loading ? '인증 중...' : '인증 확인' }}
        </button>

        <button type="button" @click="handleCancel" class="cancel-button">
          취소
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const mfaCode = ref('');
const loading = ref(false);
const error = ref<string | null>(null);

onMounted(() => {
  // MFA 챌린지 상태가 아니면 로그인 페이지로 리다이렉트
  if (!authStore.challengeName || (authStore.challengeName !== 'SMS_MFA' && authStore.challengeName !== 'SOFTWARE_TOKEN_MFA')) {
    router.push('/login');
  }
});

function getMfaMessage() {
  if (authStore.challengeName === 'SMS_MFA') {
    return '등록된 전화번호로 SMS 인증 코드가 전송되었습니다.';
  } else if (authStore.challengeName === 'SOFTWARE_TOKEN_MFA') {
    return '인증 앱(Google Authenticator, Authy 등)에 표시된 코드를 입력하세요.';
  }
  return 'MFA 인증이 필요합니다.';
}

async function handleMfaSubmit() {
  error.value = null;

  // 코드 유효성 검증
  if (!/^[0-9]{6}$/.test(mfaCode.value)) {
    error.value = '6자리 숫자 코드를 입력해주세요.';
    return;
  }

  loading.value = true;

  try {
    await authStore.completeMfaChallenge(mfaCode.value);
    router.push('/dashboard');
  } catch (err: any) {
    console.error('MFA verification error:', err);
    error.value = err.message || 'MFA 인증에 실패했습니다. 코드를 확인하고 다시 시도해주세요.';
  } finally {
    loading.value = false;
  }
}

function handleCancel() {
  authStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.mfa-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.mfa-card {
  background: white;
  padding: 2.5rem;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 500px;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 1rem;
}

.info-message {
  text-align: center;
  color: #666;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1.5rem;
  text-align: center;
  letter-spacing: 0.5rem;
  transition: border-color 0.3s;
  box-sizing: border-box;
  font-family: 'Courier New', monospace;
}

input:focus {
  outline: none;
  border-color: #667eea;
}

.hint {
  display: block;
  margin-top: 0.5rem;
  color: #888;
  font-size: 0.85rem;
  text-align: center;
}

.error-message {
  color: #e53e3e;
  background: #fff5f5;
  padding: 0.75rem;
  border-radius: 5px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.submit-button {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  margin-bottom: 1rem;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-button {
  width: 100%;
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

.cancel-button:hover {
  background: #cbd5e0;
}
</style>
