<template>
  <div class="honeypots-view">
    <div class="page-header">
      <h1>Honeypot 관리</h1>
      <button @click="openCreateModal" class="create-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>새 Honeypot 생성</span>
      </button>
    </div>

    <!-- Filters Section -->
    <div class="filters-section">
      <div class="filter-group">
        <label for="cloudAccountFilter">Cloud Account:</label>
        <select id="cloudAccountFilter" v-model="filters.cloudAccountId" @change="fetchHoneypots">
          <option value="">전체</option>
          <option v-for="account in cloudAccounts" :key="account.id" :value="account.id">
            {{ account.name }} ({{ account.provider }})
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label for="statusFilter">상태:</label>
        <select id="statusFilter" v-model="filters.status" @change="fetchHoneypots">
          <option value="">전체</option>
          <option value="running">Running</option>
          <option value="stopped">Stopped</option>
          <option value="pending">Pending</option>
          <option value="error">Error</option>
        </select>
      </div>
      <button @click="handleRefresh" class="refresh-btn" :disabled="loading">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"></polyline>
          <polyline points="1 20 1 14 7 14"></polyline>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
        새로고침
      </button>
    </div>

    <div v-if="loading" class="loading">로딩 중...</div>

    <div v-else-if="error" class="error-card">
      <h3>오류 발생</h3>
      <p>{{ error }}</p>
      <button @click="fetchHoneypots" class="retry-button">다시 시도</button>
    </div>

    <div v-else class="honeypots-container">
      <table class="honeypots-table">
        <thead>
          <tr>
            <th>이름</th>
            <th>상태</th>
            <th>Cloud Account</th>
            <th>Instance ID</th>
            <th>생성일</th>
            <th>작업</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="honeypot in honeypots" :key="honeypot.id">
            <td>
              <div class="honeypot-name">
                <span class="name">{{ honeypot.name }}</span>
                <span class="description" v-if="honeypot.description">{{ honeypot.description }}</span>
              </div>
            </td>
            <td>
              <span class="status-badge" :class="getStatusClass(honeypot.status)">
                {{ honeypot.status || '-' }}
              </span>
            </td>
            <td>{{ getCloudAccountName(honeypot.cloudAccountId) }}</td>
            <td class="instance-id">
              {{ honeypot.sourceInstanceProperties?.instanceId || '-' }}
            </td>
            <td>{{ formatDate(honeypot.created) }}</td>
            <td class="actions">
              <button @click="viewHoneypotDetail(honeypot)" class="action-btn view-btn" title="상세보기">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
              <button @click="openEditModal(honeypot)" class="action-btn edit-btn" title="수정">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button @click="confirmDelete(honeypot)" class="action-btn delete-btn" title="삭제">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="honeypots.length === 0" class="no-data">
        등록된 Honeypot이 없습니다.
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ isEditing ? 'Honeypot 수정' : '새 Honeypot 생성' }}</h2>
          <button @click="closeModal" class="close-btn" title="닫기">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <!-- Create Mode -->
          <template v-if="!isEditing">
            <div class="form-group">
              <label for="cloudAccount">Cloud Account <span class="required">*</span></label>
              <select id="cloudAccount" v-model="formData.cloudAccountId" required @change="onCloudAccountChange">
                <option value="">선택하세요</option>
                <option v-for="account in cloudAccounts" :key="account.id" :value="account.id">
                  {{ account.name }} ({{ account.provider }})
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="name">Honeypot 이름 <span class="required">*</span></label>
              <input
                id="name"
                v-model="formData.name"
                type="text"
                placeholder="Honeypot 이름을 입력하세요"
                required
              />
            </div>

            <div class="form-group">
              <label for="instanceId">Source Instance ID <span class="required">*</span></label>
              <input
                id="instanceId"
                v-model="formData.instanceId"
                type="text"
                placeholder="i-0123456789abcdef0"
                required
              />
            </div>

            <div class="form-group">
              <label for="networkMode">Network Mode <span class="required">*</span></label>
              <select id="networkMode" v-model="formData.networkMode" required>
                <option value="default">Default</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <!-- Custom Network Settings -->
            <div v-if="formData.networkMode === 'custom'" class="network-section">
              <h4>Custom Network 설정</h4>
              <div class="form-group">
                <label for="vpcId">VPC ID</label>
                <input
                  id="vpcId"
                  v-model="formData.networkSpec.vpcId"
                  type="text"
                  placeholder="vpc-0123456789abcdef0"
                />
              </div>
              <div class="form-group">
                <label for="subnetId">Subnet ID</label>
                <input
                  id="subnetId"
                  v-model="formData.networkSpec.subnetId"
                  type="text"
                  placeholder="subnet-0123456789abcdef0"
                />
              </div>
              <div class="form-group">
                <label for="securityGroupId">Security Group ID</label>
                <input
                  id="securityGroupId"
                  v-model="formData.networkSpec.securityGroupId"
                  type="text"
                  placeholder="sg-0123456789abcdef0"
                />
              </div>
            </div>
          </template>

          <!-- Edit Mode -->
          <template v-else>
            <div class="edit-note">
              <p>수정 모드에서는 이름과 설명만 변경할 수 있습니다.</p>
            </div>
            <div class="form-group">
              <label for="editName">이름 <span class="required">*</span></label>
              <input
                id="editName"
                v-model="formData.name"
                type="text"
                placeholder="Honeypot 이름"
                required
              />
            </div>
            <div class="form-group">
              <label for="editDescription">설명</label>
              <textarea
                id="editDescription"
                v-model="formData.description"
                rows="3"
                placeholder="Honeypot 설명을 입력하세요"
              ></textarea>
            </div>
          </template>

          <div v-if="modalError" class="error-message">
            {{ modalError }}
          </div>
        </div>

        <div class="modal-actions">
          <button @click="submitForm" :disabled="loading || !isFormValid" class="primary-button">
            {{ loading ? '저장 중...' : '저장' }}
          </button>
          <button @click="closeModal" :disabled="loading" class="secondary-button">
            취소
          </button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="showDetailModal" class="modal-overlay" @click="closeDetailModal">
      <div class="modal-content modal-content-wide" @click.stop>
        <div class="modal-header">
          <h2>Honeypot 상세 정보</h2>
          <button @click="closeDetailModal" class="close-btn" title="닫기">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div v-if="loadingDetail" class="loading">로딩 중...</div>
          <div v-else-if="selectedHoneypot" class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">ID:</span>
              <span class="detail-value">{{ selectedHoneypot.id }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">이름:</span>
              <span class="detail-value">{{ selectedHoneypot.name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">상태:</span>
              <span class="detail-value">
                <span class="status-badge" :class="getStatusClass(selectedHoneypot.status)">
                  {{ selectedHoneypot.status || '-' }}
                </span>
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Cloud Account:</span>
              <span class="detail-value">{{ getCloudAccountName(selectedHoneypot.cloudAccountId) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">생성일:</span>
              <span class="detail-value">{{ formatDateTime(selectedHoneypot.created) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">수정일:</span>
              <span class="detail-value">{{ formatDateTime(selectedHoneypot.modified) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Health Check:</span>
              <span class="detail-value">{{ formatDateTime(selectedHoneypot.healthChecked) }}</span>
            </div>
            <div v-if="selectedHoneypot.description" class="detail-item full-width">
              <span class="detail-label">설명:</span>
              <span class="detail-value">{{ selectedHoneypot.description }}</span>
            </div>
            <div v-if="selectedHoneypot.sourceInstanceProperties" class="detail-item full-width">
              <span class="detail-label">Source Instance Properties:</span>
              <pre class="detail-value">{{ JSON.stringify(selectedHoneypot.sourceInstanceProperties, null, 2) }}</pre>
            </div>
            <div v-if="selectedHoneypot.targetInstanceProperties" class="detail-item full-width">
              <span class="detail-label">Target Instance Properties:</span>
              <pre class="detail-value">{{ JSON.stringify(selectedHoneypot.targetInstanceProperties, null, 2) }}</pre>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="closeDetailModal" class="secondary-button">
            닫기
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click="cancelDelete">
      <div class="modal-content delete-confirm-modal" @click.stop>
        <div class="modal-header">
          <h2>Honeypot 삭제 확인</h2>
        </div>
        <div class="modal-body">
          <div class="confirm-message">
            <svg class="warning-icon" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p class="confirm-text">
              정말로 <strong>{{ deleteTarget?.name }}</strong> Honeypot을 삭제하시겠습니까?
            </p>
            <p class="warning-text">이 작업은 취소할 수 없으며, 관련 리소스가 함께 삭제될 수 있습니다.</p>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="executeDelete" :disabled="loading" class="delete-button">
            {{ loading ? '삭제 중...' : '삭제' }}
          </button>
          <button @click="cancelDelete" :disabled="loading" class="cancel-button">
            취소
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';
import apiService from '../services/api';

const loading = ref(false);
const loadingDetail = ref(false);
const error = ref<string | null>(null);
const honeypots = ref<any[]>([]);
const cloudAccounts = ref<any[]>([]);

// Filters
const filters = reactive({
  cloudAccountId: '',
  status: ''
});

// Modal states
const showModal = ref(false);
const showDetailModal = ref(false);
const showDeleteConfirm = ref(false);
const isEditing = ref(false);
const modalError = ref<string | null>(null);
const currentHoneypotId = ref<string | null>(null);
const selectedHoneypot = ref<any>(null);
const deleteTarget = ref<any>(null);

// Form data
const formData = reactive({
  cloudAccountId: '',
  csp: '',
  name: '',
  instanceId: '',
  networkMode: 'default' as 'default' | 'custom',
  networkSpec: {
    vpcId: '',
    subnetId: '',
    securityGroupId: ''
  },
  description: ''
});

const isFormValid = computed(() => {
  if (isEditing.value) {
    return formData.name.trim() !== '';
  }
  return formData.cloudAccountId && formData.name.trim() && formData.instanceId.trim() && formData.networkMode;
});

async function fetchHoneypots() {
  loading.value = true;
  error.value = null;

  try {
    const params: any = {};
    if (filters.cloudAccountId) params.cloudAccountId = filters.cloudAccountId;
    if (filters.status) params.status = filters.status;

    const data = await apiService.listHoneypots(params);
    honeypots.value = data.honeypots || [];
    console.log('Honeypots fetched:', honeypots.value.length, 'items');
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Failed to fetch honeypots';
    console.error('Error fetching honeypots:', err);
  } finally {
    loading.value = false;
  }
}

async function fetchCloudAccounts() {
  try {
    const data = await apiService.listCloudAccounts();
    cloudAccounts.value = data.cloudAccounts || [];
  } catch (err: any) {
    console.error('Error fetching cloud accounts:', err);
  }
}

function handleRefresh() {
  fetchHoneypots();
}

function getCloudAccountName(cloudAccountId: string): string {
  const account = cloudAccounts.value.find(a => a.id === cloudAccountId);
  return account ? `${account.name} (${account.provider})` : cloudAccountId || '-';
}

function getStatusClass(status: string): string {
  if (!status) return '';
  const statusLower = status.toLowerCase();
  if (statusLower === 'running' || statusLower === 'active') return 'status-running';
  if (statusLower === 'stopped' || statusLower === 'inactive') return 'status-stopped';
  if (statusLower === 'pending' || statusLower === 'creating') return 'status-pending';
  if (statusLower === 'error' || statusLower === 'failed') return 'status-error';
  return '';
}

function openCreateModal() {
  isEditing.value = false;
  currentHoneypotId.value = null;
  formData.cloudAccountId = '';
  formData.csp = '';
  formData.name = '';
  formData.instanceId = '';
  formData.networkMode = 'default';
  formData.networkSpec = { vpcId: '', subnetId: '', securityGroupId: '' };
  formData.description = '';
  modalError.value = null;
  showModal.value = true;
}

function openEditModal(honeypot: any) {
  isEditing.value = true;
  currentHoneypotId.value = honeypot.id;
  formData.name = honeypot.name || '';
  formData.description = honeypot.description || '';
  modalError.value = null;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  modalError.value = null;
}

function onCloudAccountChange() {
  const account = cloudAccounts.value.find(a => a.id === formData.cloudAccountId);
  if (account) {
    formData.csp = account.provider.toLowerCase();
  }
}

async function submitForm() {
  modalError.value = null;

  if (!formData.name || formData.name.trim() === '') {
    modalError.value = 'Honeypot 이름은 필수 항목입니다.';
    return;
  }

  loading.value = true;

  try {
    if (isEditing.value && currentHoneypotId.value) {
      await apiService.updateHoneypot(currentHoneypotId.value, {
        name: formData.name.trim(),
        description: formData.description || undefined
      });
      alert('Honeypot이 성공적으로 수정되었습니다!');
    } else {
      if (!formData.cloudAccountId || !formData.instanceId) {
        modalError.value = '필수 항목을 모두 입력해주세요.';
        loading.value = false;
        return;
      }

      const createData: any = {
        cloudAccountId: formData.cloudAccountId,
        csp: formData.csp,
        name: formData.name.trim(),
        instanceId: formData.instanceId.trim(),
        networkMode: formData.networkMode
      };

      if (formData.networkMode === 'custom') {
        createData.networkSpec = {
          vpcId: formData.networkSpec.vpcId || undefined,
          subnetId: formData.networkSpec.subnetId || undefined,
          securityGroupId: formData.networkSpec.securityGroupId || undefined
        };
      }

      await apiService.createHoneypot(createData);
      alert('Honeypot이 성공적으로 생성되었습니다!');
    }

    closeModal();
    await fetchHoneypots();
  } catch (err: any) {
    modalError.value = err.response?.data?.message || err.message || 'Honeypot 저장에 실패했습니다.';
    console.error('Error saving honeypot:', err);
  } finally {
    loading.value = false;
  }
}

async function viewHoneypotDetail(honeypot: any) {
  selectedHoneypot.value = honeypot;
  showDetailModal.value = true;

  if (honeypot.id) {
    loadingDetail.value = true;
    try {
      const data = await apiService.getHoneypot(honeypot.id);
      selectedHoneypot.value = data.honeypot || data;
    } catch (err: any) {
      console.error('Error fetching honeypot details:', err);
    } finally {
      loadingDetail.value = false;
    }
  }
}

function closeDetailModal() {
  showDetailModal.value = false;
  selectedHoneypot.value = null;
}

function confirmDelete(honeypot: any) {
  deleteTarget.value = honeypot;
  showDeleteConfirm.value = true;
}

function cancelDelete() {
  showDeleteConfirm.value = false;
  deleteTarget.value = null;
}

async function executeDelete() {
  if (!deleteTarget.value) return;

  const honeypot = deleteTarget.value;
  showDeleteConfirm.value = false;
  loading.value = true;

  try {
    await apiService.deleteHoneypot(honeypot.id);
    alert('Honeypot이 성공적으로 삭제되었습니다.');
    await fetchHoneypots();
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || 'Honeypot 삭제에 실패했습니다.');
    console.error('Error deleting honeypot:', err);
  } finally {
    loading.value = false;
    deleteTarget.value = null;
  }
}

function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR');
}

function formatDateTime(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('ko-KR');
}

onMounted(async () => {
  await fetchCloudAccounts();
  await fetchHoneypots();
});
</script>

<style scoped>
.honeypots-view {
  padding: 0;
  margin: -1.5rem;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
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

.filters-section {
  background: white;
  padding: 1rem 2rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  gap: 1.5rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 600;
  color: #4a5568;
  font-size: 0.9rem;
}

.filter-group select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #cbd5e0;
  border-radius: 5px;
  font-size: 0.95rem;
  background: white;
  cursor: pointer;
  min-width: 200px;
}

.filter-group select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f7fafc;
  color: #4a5568;
  border: 1px solid #e2e8f0;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #edf2f7;
  border-color: #667eea;
  color: #667eea;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 3rem 2rem;
  font-size: 1.1rem;
  color: #718096;
  background: white;
}

.error-card {
  background: #fff5f5;
  border: 1px solid #feb2b2;
  padding: 2rem;
  margin: 2rem;
  border-radius: 8px;
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

.honeypots-container {
  background: white;
  overflow: hidden;
}

.honeypots-table {
  width: 100%;
  border-collapse: collapse;
}

.honeypots-table thead {
  background: #f7fafc;
}

.honeypots-table th {
  padding: 1rem 2rem;
  text-align: left;
  font-weight: 600;
  color: #4a5568;
  border-bottom: 2px solid #e2e8f0;
  font-size: 0.9rem;
}

.honeypots-table td {
  padding: 1rem 2rem;
  border-bottom: 1px solid #e2e8f0;
  color: #2d3748;
  font-size: 0.9rem;
}

.honeypots-table tbody tr:hover {
  background: #f7fafc;
}

.honeypot-name {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.honeypot-name .name {
  font-weight: 600;
  color: #2d3748;
}

.honeypot-name .description {
  font-size: 0.85rem;
  color: #718096;
}

.instance-id {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: #4a5568;
}

.status-badge {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-badge.status-running {
  background: #c6f6d5;
  color: #22543d;
}

.status-badge.status-stopped {
  background: #fed7d7;
  color: #742a2a;
}

.status-badge.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.status-error {
  background: #fed7d7;
  color: #c53030;
}

.actions {
  display: flex;
  gap: 0.5rem;
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
}

.view-btn {
  color: #48bb78;
}

.view-btn:hover {
  background: #f0fff4;
  border-color: #48bb78;
}

.edit-btn {
  color: #667eea;
}

.edit-btn:hover {
  background: #ebf4ff;
  border-color: #667eea;
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
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 550px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-content-wide {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  margin: 0;
  color: #2d3748;
  font-size: 1.25rem;
}

.close-btn {
  padding: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #718096;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #e53e3e;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #4a5568;
  font-weight: 500;
  font-size: 0.95rem;
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
  font-size: 0.95rem;
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

.network-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid #e2e8f0;
}

.network-section h4 {
  margin: 0 0 1rem 0;
  color: #4a5568;
  font-size: 1rem;
}

.edit-note {
  padding: 1rem;
  background: #ebf8ff;
  border: 1px solid #90cdf4;
  border-radius: 5px;
  margin-bottom: 1.5rem;
}

.edit-note p {
  margin: 0;
  color: #2c5282;
  font-size: 0.9rem;
}

.error-message {
  color: #e53e3e;
  background: #fff5f5;
  padding: 0.75rem;
  border-radius: 5px;
  margin-top: 1rem;
  font-size: 0.9rem;
  border: 1px solid #feb2b2;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
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

/* Detail Grid */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  background: #f7fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #718096;
  margin-bottom: 0.5rem;
}

.detail-value {
  font-size: 0.95rem;
  color: #2d3748;
  word-break: break-word;
}

.detail-value pre {
  background: #2d3748;
  color: #e2e8f0;
  padding: 1rem;
  border-radius: 5px;
  overflow-x: auto;
  font-size: 0.85rem;
  line-height: 1.5;
  margin: 0;
}

/* Delete Confirmation Modal */
.delete-confirm-modal {
  max-width: 450px;
}

.confirm-message {
  text-align: center;
  padding: 1rem 0;
}

.warning-icon {
  color: #f59e0b;
  margin-bottom: 1rem;
}

.confirm-text {
  font-size: 1.1rem;
  color: #2d3748;
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

.confirm-text strong {
  color: #667eea;
  font-weight: 600;
}

.warning-text {
  font-size: 0.9rem;
  color: #e53e3e;
  margin: 0;
  font-weight: 500;
}

.delete-button {
  flex: 1;
  padding: 0.75rem;
  background: #e53e3e;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-button:hover:not(:disabled) {
  background: #c53030;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(229, 62, 62, 0.3);
}

.delete-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-button {
  flex: 1;
  padding: 0.75rem;
  background: #e2e8f0;
  color: #4a5568;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-button:hover:not(:disabled) {
  background: #cbd5e0;
}

.cancel-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .filters-section {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group select {
    width: 100%;
    min-width: 0;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
