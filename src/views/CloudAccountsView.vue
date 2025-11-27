<template>
  <div class="cloud-accounts-view">
    <div class="page-header">
      <h1>클라우드 계정 관리</h1>
      <button @click="openCreateModal" class="create-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>새 클라우드 계정 등록</span>
      </button>
    </div>

    <div v-if="loading" class="loading">로딩 중...</div>

    <div v-else-if="error" class="error-card">
      <h3>오류 발생</h3>
      <p>{{ error }}</p>
      <button @click="fetchCloudAccounts" class="retry-button">다시 시도</button>
    </div>

    <div v-else class="cloud-accounts-grid">
      <div
        v-for="account in cloudAccounts"
        :key="account.id"
        class="cloud-account-card"
        :class="`provider-${account.provider.toLowerCase()}`"
      >
        <div class="card-header">
          <div class="provider-badge">
            {{ account.provider }}
          </div>
          <span class="status-badge" :class="account.status">
            {{ account.status }}
          </span>
        </div>

        <div class="card-body">
          <h3>{{ account.name }}</h3>
          <div class="account-info">
            <div class="info-row">
              <span class="label">Account ID:</span>
              <span class="value">{{ account.accountName || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Type:</span>
              <span class="value">{{ account.type || 'single' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Created:</span>
              <span class="value">{{ formatDate(account.created) }}</span>
            </div>
          </div>
        </div>

        <div class="card-actions">
          <button @click="openEditModal(account)" class="action-btn edit">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            수정
          </button>
          <button @click="confirmDelete(account)" class="action-btn delete">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            삭제
          </button>
        </div>
      </div>

      <div v-if="cloudAccounts.length === 0" class="no-data">
        등록된 클라우드 계정이 없습니다.
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content large" @click.stop>
        <h2>{{ isEditing ? '클라우드 계정 수정' : '새 클라우드 계정 등록' }}</h2>

        <div class="form-group" v-if="!isEditing">
          <label for="provider">클라우드 제공자 <span class="required">*</span></label>
          <select id="provider" v-model="formData.provider" required>
            <option value="">선택하세요</option>
            <option value="AWS">AWS</option>
            <option value="AZURE">Azure</option>
            <option value="GCP">GCP</option>
          </select>
        </div>

        <div class="form-group">
          <label for="accountName">계정 이름 <span class="required">*</span></label>
          <input
            id="accountName"
            v-model="formData.name"
            type="text"
            placeholder="계정 이름을 입력하세요"
            required
          />
        </div>

        <div class="form-group" v-if="!isEditing">
          <label for="accountType">계정 타입</label>
          <select id="accountType" v-model="formData.type">
            <option value="single">Single</option>
            <option value="master">Master</option>
            <option value="member">Member</option>
          </select>
        </div>

        <!-- AWS Credentials -->
        <div v-if="formData.provider === 'AWS' && !isEditing" class="credentials-section">
          <h3>AWS 인증 정보</h3>
          <div class="form-group">
            <label for="awsAccountId">AWS Account ID</label>
            <input
              id="awsAccountId"
              v-model="formData.accessProperties.accountId"
              type="text"
              placeholder="123456789012"
            />
          </div>
          <div class="form-group">
            <label for="awsAccessKeyId">Access Key ID</label>
            <input
              id="awsAccessKeyId"
              v-model="formData.accessProperties.accessKeyId"
              type="text"
              placeholder="AKIA..."
            />
          </div>
          <div class="form-group">
            <label for="awsSecretAccessKey">Secret Access Key</label>
            <input
              id="awsSecretAccessKey"
              v-model="formData.accessProperties.secretAccessKey"
              type="password"
              placeholder="Secret Access Key"
            />
          </div>
          <div class="form-group">
            <label for="awsRoleArn">Role ARN (Optional)</label>
            <input
              id="awsRoleArn"
              v-model="formData.accessProperties.roleArn"
              type="text"
              placeholder="arn:aws:iam::..."
            />
          </div>
          <div class="form-group">
            <label for="awsExternalId">External ID (Optional)</label>
            <input
              id="awsExternalId"
              v-model="formData.accessProperties.externalId"
              type="text"
              placeholder="External ID"
            />
          </div>
        </div>

        <!-- Azure Credentials -->
        <div v-if="formData.provider === 'AZURE' && !isEditing" class="credentials-section">
          <h3>Azure 인증 정보</h3>
          <div class="form-group">
            <label for="azureAppId">Application (Client) ID <span class="required">*</span></label>
            <input
              id="azureAppId"
              v-model="formData.accessProperties.ApplicationID"
              type="text"
              placeholder="Application ID"
              required
            />
          </div>
          <div class="form-group">
            <label for="azureKey">Client Secret <span class="required">*</span></label>
            <input
              id="azureKey"
              v-model="formData.accessProperties.KeyValue"
              type="password"
              placeholder="Client Secret"
              required
            />
          </div>
          <div class="form-group">
            <label for="azureDirectoryId">Directory (Tenant) ID <span class="required">*</span></label>
            <input
              id="azureDirectoryId"
              v-model="formData.accessProperties.DirectoryID"
              type="text"
              placeholder="Tenant ID"
              required
            />
          </div>
          <div class="form-group">
            <label for="azureSubId">Subscription ID <span class="required">*</span></label>
            <input
              id="azureSubId"
              v-model="formData.accessProperties.SubscriptionID"
              type="text"
              placeholder="Subscription ID"
              required
            />
          </div>
        </div>

        <!-- GCP Credentials -->
        <div v-if="formData.provider === 'GCP' && !isEditing" class="credentials-section">
          <h3>GCP 인증 정보</h3>
          <div class="form-group">
            <label for="gcpProjectId">Project ID <span class="required">*</span></label>
            <input
              id="gcpProjectId"
              v-model="formData.accessProperties.projectId"
              type="text"
              placeholder="my-project-id"
              required
            />
          </div>
          <div class="form-group">
            <label for="gcpServiceAccount">Service Account Key (JSON)</label>
            <textarea
              id="gcpServiceAccount"
              v-model="gcpServiceAccountJson"
              rows="8"
              placeholder="Paste your service account JSON key here"
            ></textarea>
          </div>
        </div>

        <!-- Edit Mode: Only allow name and status change -->
        <div v-if="isEditing" class="edit-note">
          <p>수정 모드에서는 계정 이름과 상태만 변경할 수 있습니다.</p>
          <div class="form-group">
            <label for="editStatus">상태</label>
            <select id="editStatus" v-model="formData.status">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div v-if="modalError" class="error-message">
          {{ modalError }}
        </div>

        <div class="modal-actions">
          <button @click="submitForm" :disabled="loading || !formData.name" class="primary-button">
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
import { ref, onMounted, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import apiService from '../services/api';

const authStore = useAuthStore();
const loading = ref(false);
const error = ref<string | null>(null);
const cloudAccounts = ref<any[]>([]);

const showModal = ref(false);
const isEditing = ref(false);
const modalError = ref<string | null>(null);
const currentAccountId = ref<string | null>(null);
const gcpServiceAccountJson = ref('');
const formData = ref({
  provider: '' as 'AWS' | 'AZURE' | 'GCP' | '',
  name: '',
  type: 'single' as 'single' | 'master' | 'member',
  status: 'active' as 'active' | 'inactive',
  accessProperties: {} as any,
});

async function fetchCloudAccounts() {
  loading.value = true;
  error.value = null;

  try {
    const data = await apiService.listCloudAccounts({
      organizationId: authStore.userInfo?.recentOrganizationId,
    });
    cloudAccounts.value = data.cloudAccounts || [];
    console.log('Cloud accounts fetched:', cloudAccounts.value);
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Failed to fetch cloud accounts';
    console.error('Error fetching cloud accounts:', err);
  } finally {
    loading.value = false;
  }
}

function openCreateModal() {
  isEditing.value = false;
  currentAccountId.value = null;
  gcpServiceAccountJson.value = '';
  formData.value = {
    provider: '',
    name: '',
    type: 'single',
    status: 'active',
    accessProperties: {},
  };
  modalError.value = null;
  showModal.value = true;
}

function openEditModal(account: any) {
  isEditing.value = true;
  currentAccountId.value = account.id;
  formData.value = {
    provider: account.provider,
    name: account.name || '',
    type: account.type || 'single',
    status: account.status || 'active',
    accessProperties: {},
  };
  modalError.value = null;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  modalError.value = null;
}

// Reset accessProperties when provider changes
watch(() => formData.value.provider, () => {
  formData.value.accessProperties = {};
  gcpServiceAccountJson.value = '';
});

async function submitForm() {
  modalError.value = null;

  if (!formData.value.name || formData.value.name.trim() === '') {
    modalError.value = '계정 이름은 필수 항목입니다.';
    return;
  }

  if (!isEditing.value && !formData.value.provider) {
    modalError.value = '클라우드 제공자를 선택해주세요.';
    return;
  }

  // Validate GCP service account JSON
  if (formData.value.provider === 'GCP' && gcpServiceAccountJson.value && !isEditing.value) {
    try {
      formData.value.accessProperties.serviceAccountKey = JSON.parse(gcpServiceAccountJson.value);
    } catch (e) {
      modalError.value = 'Service Account Key JSON 형식이 올바르지 않습니다.';
      return;
    }
  }

  loading.value = true;

  try {
    if (isEditing.value && currentAccountId.value) {
      // Update cloud account
      await apiService.updateCloudAccount(currentAccountId.value, {
        name: formData.value.name.trim(),
        status: formData.value.status,
      });
      alert('클라우드 계정이 성공적으로 수정되었습니다!');
    } else {
      // Create cloud account
      await apiService.createCloudAccount({
        provider: formData.value.provider as 'AWS' | 'AZURE' | 'GCP',
        name: formData.value.name.trim(),
        type: formData.value.type,
        accessProperties: formData.value.accessProperties,
      });
      alert('클라우드 계정이 성공적으로 등록되었습니다!');
    }

    closeModal();
    await fetchCloudAccounts();
  } catch (err: any) {
    modalError.value = err.response?.data?.message || err.message || '클라우드 계정 저장에 실패했습니다.';
    console.error('Error saving cloud account:', err);
  } finally {
    loading.value = false;
  }
}

async function confirmDelete(account: any) {
  const confirmed = confirm(`정말로 "${account.name}" 계정을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.`);
  if (!confirmed) return;

  try {
    await apiService.deleteCloudAccount(account.id);
    alert('클라우드 계정이 성공적으로 삭제되었습니다.');
    await fetchCloudAccounts();
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || '클라우드 계정 삭제에 실패했습니다.');
    console.error('Error deleting cloud account:', err);
  }
}

function formatDate(dateString: string) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR');
}

onMounted(() => {
  fetchCloudAccounts();
});
</script>

<style scoped>
.cloud-accounts-view {
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
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

.cloud-accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.cloud-account-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  border-left: 4px solid #cbd5e0;
  transition: all 0.3s;
}

.cloud-account-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.cloud-account-card.provider-aws {
  border-left-color: #ff9900;
}

.cloud-account-card.provider-azure {
  border-left-color: #0078d4;
}

.cloud-account-card.provider-gcp {
  border-left-color: #4285f4;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #f7fafc;
  border-bottom: 1px solid #e2e8f0;
}

.provider-badge {
  padding: 0.35rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  color: white;
}

.provider-aws .provider-badge {
  background: #ff9900;
}

.provider-azure .provider-badge {
  background: #0078d4;
}

.provider-gcp .provider-badge {
  background: #4285f4;
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

.status-badge.inactive {
  background: #fed7d7;
  color: #742a2a;
}

.card-body {
  padding: 1.5rem;
}

.card-body h3 {
  margin: 0 0 1rem 0;
  color: #2d3748;
  font-size: 1.25rem;
}

.account-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f7fafc;
}

.info-row .label {
  font-weight: 600;
  color: #4a5568;
  font-size: 0.9rem;
}

.info-row .value {
  color: #718096;
  font-size: 0.9rem;
  text-align: right;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: #f7fafc;
  border-top: 1px solid #e2e8f0;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 5px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.action-btn.edit {
  color: #667eea;
}

.action-btn.edit:hover {
  background: #ebf4ff;
  border-color: #667eea;
}

.action-btn.delete {
  color: #e53e3e;
}

.action-btn.delete:hover {
  background: #fff5f5;
  border-color: #e53e3e;
}

.no-data {
  grid-column: 1 / -1;
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

.modal-content.large {
  max-width: 600px;
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #2d3748;
}

.credentials-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid #e2e8f0;
}

.credentials-section h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #4a5568;
  font-size: 1.1rem;
}

.edit-note {
  padding: 1rem;
  background: #ebf8ff;
  border: 1px solid #90cdf4;
  border-radius: 5px;
  margin-bottom: 1rem;
}

.edit-note p {
  margin: 0 0 1rem 0;
  color: #2c5282;
  font-size: 0.9rem;
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
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #cbd5e0;
  border-radius: 5px;
  font-size: 1rem;
  box-sizing: border-box;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group textarea {
  font-family: 'Courier New', monospace;
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
