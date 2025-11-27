<template>
  <div class="system-users-view">
    <div class="page-header">
      <h1>전체 사용자 관리 (System Admin)</h1>
      <button @click="openCreateModal" class="create-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>새 사용자 생성</span>
      </button>
    </div>

    <!-- Organization Filter -->
    <div class="filter-section">
      <label for="orgFilter">조직 필터:</label>
      <select id="orgFilter" v-model="selectedOrganizationId" @change="fetchUsers" class="org-select">
        <option value="">전체 조직</option>
        <option
          v-for="org in organizations"
          :key="org.id"
          :value="org.id"
        >
          {{ org.name }}
        </option>
      </select>
    </div>

    <div v-if="loading" class="loading">로딩 중...</div>

    <div v-else-if="error" class="error-card">
      <h3>오류 발생</h3>
      <p>{{ error }}</p>
      <button @click="fetchUsers" class="retry-button">다시 시도</button>
    </div>

    <div v-else class="users-table-container">
      <table class="users-table">
        <thead>
          <tr>
            <th>이름</th>
            <th>이메일</th>
            <th>조직</th>
            <th>전화번호</th>
            <th>역할</th>
            <th>MFA</th>
            <th>상태</th>
            <th>작업</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td class="user-name">{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>
              <span v-for="org in user.organizations" :key="org.id" class="org-badge">
                {{ org.name }}
              </span>
            </td>
            <td>{{ user.phoneNumber || '-' }}</td>
            <td>
              <span class="role-badge" v-for="role in getUserRoles(user)" :key="role">
                {{ getRoleDisplayName(role) }}
              </span>
            </td>
            <td>
              <span class="mfa-status" :class="{ enabled: user.mfaEnabled }">
                {{ user.mfaEnabled ? '활성' : '비활성' }}
              </span>
            </td>
            <td>
              <span class="status-badge" :class="getStatusClass(user)">
                {{ getStatusText(user) }}
              </span>
            </td>
            <td class="actions">
              <button @click="resetPassword(user)" class="action-btn reset-btn" title="비밀번호 초기화">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </button>
              <button @click="inviteUser(user)" class="action-btn invite-btn" title="초대 메일 발송">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </button>
              <button @click="confirmDelete(user)" class="action-btn delete-btn" title="삭제">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="users.length === 0" class="no-data">
        등록된 사용자가 없습니다.
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h2>새 사용자 생성</h2>

        <div class="form-group">
          <label for="userOrganization">조직 선택 <span class="required">*</span></label>
          <select id="userOrganization" v-model="formData.organizationId" required>
            <option value="">조직을 선택하세요</option>
            <option
              v-for="org in organizations"
              :key="org.id"
              :value="org.id"
            >
              {{ org.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="userName">이름 <span class="required">*</span></label>
          <input
            id="userName"
            v-model="formData.name"
            type="text"
            placeholder="사용자 이름을 입력하세요"
            required
          />
        </div>

        <div class="form-group">
          <label for="userEmail">이메일 <span class="required">*</span></label>
          <input
            id="userEmail"
            v-model="formData.email"
            type="email"
            placeholder="이메일 주소를 입력하세요"
            required
          />
        </div>

        <div class="form-group">
          <label for="userPhone">전화번호</label>
          <input
            id="userPhone"
            v-model="formData.phoneNumber"
            type="tel"
            placeholder="전화번호를 입력하세요"
          />
        </div>

        <div class="form-group">
          <label for="userTimezone">타임존</label>
          <select id="userTimezone" v-model="formData.timezone">
            <option value="UTC+9">UTC+9 (한국)</option>
            <option value="UTC+0">UTC+0 (GMT)</option>
            <option value="UTC-5">UTC-5 (EST)</option>
            <option value="UTC-8">UTC-8 (PST)</option>
          </select>
        </div>

        <div class="form-group">
          <label for="userLanguage">언어</label>
          <select id="userLanguage" v-model="formData.language">
            <option value="ko">한국어</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </div>

        <div class="form-group">
          <label>역할</label>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="formData.roles"
                value="admin"
              />
              <span>관리자</span>
            </label>
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="formData.roles"
                value="user"
              />
              <span>사용자</span>
            </label>
          </div>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="formData.mfaMandatory"
            />
            <span>MFA 필수</span>
          </label>
        </div>

        <div v-if="modalError" class="error-message">
          {{ modalError }}
        </div>

        <div class="modal-actions">
          <button @click="submitForm" :disabled="loading || !formData.name || !formData.email || !formData.organizationId" class="primary-button">
            {{ loading ? '저장 중...' : '저장' }}
          </button>
          <button @click="closeModal" :disabled="loading" class="secondary-button">
            취소
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import apiService from '../services/api';

const loading = ref(false);
const error = ref<string | null>(null);
const users = ref<any[]>([]);
const organizations = ref<any[]>([]);
const selectedOrganizationId = ref<string>('');

const showModal = ref(false);
const modalError = ref<string | null>(null);
const formData = ref({
  organizationId: '',
  name: '',
  email: '',
  phoneNumber: '',
  timezone: 'UTC+9',
  language: 'ko',
  roles: [] as string[],
  mfaMandatory: false,
});

async function fetchOrganizations() {
  try {
    const data = await apiService.adminListOrganizations();
    organizations.value = Array.isArray(data) ? data : [];
  } catch (err: any) {
    console.error('Error fetching organizations:', err);
  }
}

async function fetchUsers() {
  loading.value = true;
  error.value = null;

  try {
    const data = await apiService.adminListUsers(selectedOrganizationId.value || undefined);
    users.value = Array.isArray(data) ? data : [];
    console.log('System users fetched:', users.value);
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Failed to fetch users';
    console.error('Error fetching users:', err);
  } finally {
    loading.value = false;
  }
}

function openCreateModal() {
  formData.value = {
    organizationId: selectedOrganizationId.value || '',
    name: '',
    email: '',
    phoneNumber: '',
    timezone: 'UTC+9',
    language: 'ko',
    roles: ['user'],
    mfaMandatory: false,
  };
  modalError.value = null;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  modalError.value = null;
}

async function submitForm() {
  modalError.value = null;

  if (!formData.value.organizationId) {
    modalError.value = '조직을 선택해주세요.';
    return;
  }

  if (!formData.value.name || formData.value.name.trim() === '') {
    modalError.value = '이름은 필수 항목입니다.';
    return;
  }

  if (!formData.value.email || formData.value.email.trim() === '') {
    modalError.value = '이메일은 필수 항목입니다.';
    return;
  }

  if (formData.value.roles.length === 0) {
    modalError.value = '최소 하나의 역할을 선택해야 합니다.';
    return;
  }

  loading.value = true;

  try {
    const createData: any = {
      email: formData.value.email.trim(),
      name: formData.value.name.trim(),
      phoneNumber: formData.value.phoneNumber?.trim(),
      timezone: formData.value.timezone,
      language: formData.value.language,
      roles: formData.value.roles,
      mfaMandatory: formData.value.mfaMandatory,
    };

    await apiService.adminCreateUser(formData.value.organizationId, createData);
    alert('사용자가 성공적으로 생성되었습니다!');

    closeModal();
    await fetchUsers();
  } catch (err: any) {
    modalError.value = err.response?.data?.message || err.message || '사용자 저장에 실패했습니다.';
    console.error('Error saving user:', err);
  } finally {
    loading.value = false;
  }
}

async function resetPassword(user: any) {
  const confirmed = confirm(`${user.name}님의 비밀번호를 초기화하시겠습니까?`);
  if (!confirmed) return;

  try {
    await apiService.adminResetUserPassword(user.id);
    alert('비밀번호 초기화 메일이 발송되었습니다.');
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || '비밀번호 초기화에 실패했습니다.');
    console.error('Error resetting password:', err);
  }
}

async function inviteUser(user: any) {
  try {
    await apiService.inviteAdminUser(user.id);
    alert('초대 메일이 발송되었습니다.');
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || '초대 메일 발송에 실패했습니다.');
    console.error('Error inviting user:', err);
  }
}

async function confirmDelete(user: any) {
  const confirmed = confirm(`정말로 ${user.name}님을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.`);
  if (!confirmed) return;

  try {
    await apiService.adminDeleteUser(user.id, selectedOrganizationId.value || undefined);
    alert('사용자가 성공적으로 삭제되었습니다.');
    await fetchUsers();
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || '사용자 삭제에 실패했습니다.');
    console.error('Error deleting user:', err);
  }
}

function getUserRoles(user: any): string[] {
  if (!user.organizationRoles) {
    return [];
  }

  // Get unique roles across all organizations
  const roles = new Set<string>();
  user.organizationRoles.forEach((roleObj: any) => {
    roles.add(roleObj.role);
  });

  return Array.from(roles);
}

function getRoleDisplayName(role: string): string {
  const roleMap: Record<string, string> = {
    systemadmin: '시스템 관리자',
    admin: '관리자',
    user: '사용자',
  };
  return roleMap[role] || role;
}

function getStatusClass(user: any): string {
  if (user.invitationComplete) {
    return 'active';
  }
  return 'pending';
}

function getStatusText(user: any): string {
  if (user.invitationComplete) {
    return '활성';
  }
  return '초대 대기';
}

onMounted(async () => {
  await fetchOrganizations();
  await fetchUsers();
});
</script>

<style scoped>
/* Reuse styles from UsersView */
.system-users-view {
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  color: #2d3748;
  margin: 0;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.create-btn:hover {
  background: #5568d3;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.filter-section {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-section label {
  font-weight: 600;
  color: #4a5568;
}

.org-select {
  flex: 1;
  max-width: 300px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #cbd5e0;
  border-radius: 5px;
  font-size: 0.95rem;
  background: white;
  cursor: pointer;
}

.org-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.loading {
  text-align: center;
  padding: 3rem;
  font-size: 1.1rem;
  color: #718096;
}

.error-card {
  background: #fff5f5;
  border: 1px solid #feb2b2;
  border-radius: 8px;
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

.users-table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1100px;
}

.users-table thead {
  background: #f7fafc;
}

.users-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #4a5568;
  border-bottom: 2px solid #e2e8f0;
}

.users-table td {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  color: #2d3748;
}

.users-table tbody tr:hover {
  background: #f7fafc;
}

.user-name {
  font-weight: 600;
  color: #2d3748;
}

.org-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  margin-right: 0.25rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  background: #bee3f8;
  color: #2c5282;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  margin-right: 0.25rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  background: #e6fffa;
  color: #234e52;
}

.mfa-status {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  background: #fed7d7;
  color: #742a2a;
}

.mfa-status.enabled {
  background: #c6f6d5;
  color: #22543d;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.active {
  background: #c6f6d5;
  color: #22543d;
}

.status-badge.pending {
  background: #feebc8;
  color: #7c2d12;
}

.actions {
  text-align: center;
  white-space: nowrap;
}

.action-btn {
  padding: 0.5rem;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 0.25rem;
}

.reset-btn {
  color: #ed8936;
}

.reset-btn:hover {
  background: #fffaf0;
  border-color: #ed8936;
}

.invite-btn {
  color: #48bb78;
}

.invite-btn:hover {
  background: #f0fff4;
  border-color: #48bb78;
}

.delete-btn {
  color: #e53e3e;
}

.delete-btn:hover {
  background: #fff5f5;
  border-color: #e53e3e;
}

.no-data {
  padding: 3rem;
  text-align: center;
  color: #718096;
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
  color: #2d3748;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #4a5568;
  font-weight: 500;
}

.form-group .required {
  color: #e53e3e;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #cbd5e0;
  border-radius: 5px;
  font-size: 1rem;
  box-sizing: border-box;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: normal;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  cursor: pointer;
}

.error-message {
  color: #e53e3e;
  background: #fff5f5;
  padding: 0.75rem;
  border-radius: 5px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
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
