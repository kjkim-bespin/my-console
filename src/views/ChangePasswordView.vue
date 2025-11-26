<template>
  <div class="change-password-container">
    <div class="change-password-card">
      <h1>비밀번호 변경 필요</h1>
      <p class="info-message">
        첫 로그인이거나 관리자가 비밀번호 재설정을 요청했습니다.<br />
        새로운 비밀번호를 설정해주세요.
      </p>

      <form @submit.prevent="handlePasswordChange">
        <div class="form-group">
          <label for="newPassword">새 비밀번호</label>
          <input
            id="newPassword"
            v-model="newPassword"
            type="password"
            placeholder="새 비밀번호를 입력하세요"
            required
            minlength="8"
          />
          <small class="hint">최소 8자 이상, 대소문자, 숫자, 특수문자 포함</small>
        </div>

        <div class="form-group">
          <label for="confirmPassword">비밀번호 확인</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            placeholder="비밀번호를 다시 입력하세요"
            required
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" :disabled="loading" class="submit-button">
          {{ loading ? '변경 중...' : '비밀번호 변경' }}
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

const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref<string | null>(null);

onMounted(() => {
  // NEW_PASSWORD_REQUIRED 상태가 아니면 로그인 페이지로 리다이렉트
  if (!authStore.challengeName || authStore.challengeName !== 'NEW_PASSWORD_REQUIRED') {
    router.push('/login');
  }
});

async function handlePasswordChange() {
  error.value = null;

  // 비밀번호 확인
  if (newPassword.value !== confirmPassword.value) {
    error.value = '비밀번호가 일치하지 않습니다.';
    return;
  }

  // 비밀번호 강도 검증
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(newPassword.value)) {
    error.value = '비밀번호는 최소 8자 이상이며, 대소문자, 숫자, 특수문자를 포함해야 합니다.';
    return;
  }

  loading.value = true;

  try {
    await authStore.completeNewPasswordChallenge(newPassword.value);
    router.push('/dashboard');
  } catch (err: any) {
    console.error('Password change error:', err);
    error.value = err.message || '비밀번호 변경에 실패했습니다.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.change-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.change-password-card {
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
  font-size: 1rem;
  transition: border-color 0.3s;
  box-sizing: border-box;
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
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
