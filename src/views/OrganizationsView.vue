<template>
  <div class="organizations-view">
    <div class="page-header">
      <h1>조직 관리</h1>
      <button @click="openCreateModal" class="create-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>새 조직 생성</span>
      </button>
    </div>

    <div v-if="loading" class="loading">로딩 중...</div>

    <div v-else-if="error" class="error-card">
      <h3>오류 발생</h3>
      <p>{{ error }}</p>
      <button @click="fetchOrganizations" class="retry-button">다시 시도</button>
    </div>

    <div v-else class="organizations-table-container">
      <table class="organizations-table">
        <thead>
          <tr>
            <th>조직 이름</th>
            <th>설명</th>
            <th>상태</th>
            <th>생성일</th>
            <th>작업</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="org in organizations" :key="org.id">
            <td class="org-name">{{ org.name }}</td>
            <td class="org-description">{{ org.description || '-' }}</td>
            <td>
              <span class="status-badge" :class="org.status">
                {{ org.status }}
              </span>
            </td>
            <td>{{ formatDate(org.created) }}</td>
            <td class="actions">
              <button @click="openViewModal(org)" class="action-btn view-btn" title="상세보기">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
              <button @click="openEditModal(org)" class="action-btn edit-btn" title="수정">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button @click="confirmDelete(org)" class="action-btn delete-btn" title="삭제">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="organizations.length === 0" class="no-data">
        등록된 조직이 없습니다.
      </div>
    </div>

    <!-- View Details Modal -->
    <div v-if="showViewModal" class="modal-overlay" @click="closeViewModal">
      <div class="modal-content modal-content-wide" @click.stop>
        <h2>조직 상세 정보</h2>

        <div class="detail-grid">
          <div class="detail-column">
            <div class="detail-group">
              <label>조직 ID</label>
              <div class="detail-value">{{ viewData.id || '-' }}</div>
            </div>

            <div class="detail-group">
              <label>조직 이름</label>
              <div class="detail-value">{{ viewData.name || '-' }}</div>
            </div>

            <div class="detail-group">
              <label>상태</label>
              <div class="detail-value">
                <span class="status-badge" :class="viewData.status">
                  {{ viewData.status || '-' }}
                </span>
              </div>
            </div>

            <div class="detail-group">
              <label>설명</label>
              <div class="detail-value">{{ viewData.description || '-' }}</div>
            </div>
          </div>

          <div class="detail-column">
            <div class="detail-group">
              <label>생성일</label>
              <div class="detail-value">{{ formatDate(viewData.created) }}</div>
            </div>

            <div class="detail-group">
              <label>생성자</label>
              <div class="detail-value">{{ viewData.createdBy || '-' }}</div>
            </div>

            <div class="detail-group">
              <label>수정일</label>
              <div class="detail-value">{{ formatDate(viewData.modified) }}</div>
            </div>

            <div class="detail-group">
              <label>수정자</label>
              <div class="detail-value">{{ viewData.modifiedBy || '-' }}</div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="closeViewModal" class="secondary-button">
            닫기
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h2>{{ isEditing ? '조직 수정' : '새 조직 생성' }}</h2>

        <div class="form-group">
          <label for="orgName">조직 이름 <span class="required">*</span></label>
          <input
            id="orgName"
            v-model="formData.name"
            type="text"
            placeholder="조직 이름을 입력하세요"
            required
          />
        </div>

        <div class="form-group">
          <label for="orgDescription">설명</label>
          <textarea
            id="orgDescription"
            v-model="formData.description"
            placeholder="조직 설명을 입력하세요"
            rows="4"
          ></textarea>
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

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click="cancelDelete">
      <div class="modal-content delete-confirm-modal" @click.stop>
        <div class="modal-header">
          <h2>조직 삭제 확인</h2>
        </div>
        <div class="modal-body">
          <div class="confirm-message">
            <svg class="warning-icon" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p class="confirm-text">
              정말로 <strong>{{ deleteTarget?.name }}</strong> 조직을 삭제하시겠습니까?
            </p>
            <p class="warning-text">이 작업은 취소할 수 없습니다.</p>
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
import { ref, onMounted } from 'vue';
import apiService from '../services/api';

const loading = ref(false);
const error = ref<string | null>(null);
const organizations = ref<any[]>([]);

const showModal = ref(false);
const isEditing = ref(false);
const modalError = ref<string | null>(null);
const currentOrgId = ref<string | null>(null);
const formData = ref({
  name: '',
  description: '',
});

const showViewModal = ref(false);
const viewData = ref<any>({});

// Delete confirmation
const showDeleteConfirm = ref(false);
const deleteTarget = ref<any>(null);

async function fetchOrganizations() {
  loading.value = true;
  error.value = null;

  try {
    const data = await apiService.adminListOrganizations();
    organizations.value = Array.isArray(data) ? data : [];
    console.log('Organizations fetched:', organizations.value);
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Failed to fetch organizations';
    console.error('Error fetching organizations:', err);
  } finally {
    loading.value = false;
  }
}

function openViewModal(org: any) {
  viewData.value = { ...org };
  showViewModal.value = true;
}

function closeViewModal() {
  showViewModal.value = false;
  viewData.value = {};
}

function openCreateModal() {
  isEditing.value = false;
  currentOrgId.value = null;
  formData.value = {
    name: '',
    description: '',
  };
  modalError.value = null;
  showModal.value = true;
}

function openEditModal(org: any) {
  isEditing.value = true;
  currentOrgId.value = org.id;
  formData.value = {
    name: org.name || '',
    description: org.description || '',
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

  if (!formData.value.name || formData.value.name.trim() === '') {
    modalError.value = '조직 이름은 필수 항목입니다.';
    return;
  }

  loading.value = true;

  try {
    if (isEditing.value && currentOrgId.value) {
      // Update organization
      await apiService.adminUpdateOrganization(currentOrgId.value, {
        name: formData.value.name.trim(),
        description: formData.value.description?.trim(),
      });
      alert('조직이 성공적으로 수정되었습니다!');
    } else {
      // Create organization
      await apiService.createOrganization({
        name: formData.value.name.trim(),
        description: formData.value.description?.trim(),
      });
      alert('조직이 성공적으로 생성되었습니다!');
    }

    closeModal();
    await fetchOrganizations();
  } catch (err: any) {
    modalError.value = err.response?.data?.message || err.message || '조직 저장에 실패했습니다.';
    console.error('Error saving organization:', err);
  } finally {
    loading.value = false;
  }
}

function confirmDelete(org: any) {
  deleteTarget.value = org;
  showDeleteConfirm.value = true;
}

function cancelDelete() {
  showDeleteConfirm.value = false;
  deleteTarget.value = null;
}

async function executeDelete() {
  if (!deleteTarget.value) return;

  const org = deleteTarget.value;
  showDeleteConfirm.value = false;
  loading.value = true;

  try {
    await apiService.adminDeleteOrganization(org.id);
    alert('조직이 성공적으로 삭제되었습니다!');
    await fetchOrganizations();
  } catch (err: any) {
    const errorMessage = err.response?.data?.message || err.message || '조직 삭제에 실패했습니다.';
    alert(`삭제 실패: ${errorMessage}`);
    console.error('Error deleting organization:', err);
  } finally {
    loading.value = false;
    deleteTarget.value = null;
  }
}

function formatDate(dateString: string) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR') + ' ' + date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

onMounted(() => {
  fetchOrganizations();
});
</script>

<style scoped>
.organizations-view {
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
  padding: 1.5rem;
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

.organizations-table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.organizations-table {
  width: 100%;
  border-collapse: collapse;
}

.organizations-table thead {
  background: #f7fafc;
}

.organizations-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #4a5568;
  border-bottom: 2px solid #e2e8f0;
}

.organizations-table td {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  color: #2d3748;
}

.organizations-table tbody tr:hover {
  background: #f7fafc;
}

.org-name {
  font-weight: 600;
  color: #2d3748;
}

.org-description {
  color: #718096;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-badge.created,
.status-badge.updated {
  background: #c6f6d5;
  color: #22543d;
}

.status-badge.deleted {
  background: #fed7d7;
  color: #742a2a;
}

.actions {
  text-align: center;
  display: flex;
  gap: 0.5rem;
  justify-content: center;
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
  color: #f56565;
}

.delete-btn:hover {
  background: #fff5f5;
  border-color: #f56565;
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
  padding: 1.5rem;
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
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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

/* Detail View Styles */
.modal-content-wide {
  max-width: 700px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.detail-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-group {
  margin-bottom: 0;
}

.detail-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #4a5568;
  font-weight: 600;
  font-size: 0.9rem;
}

.detail-group .detail-value {
  padding: 0.75rem;
  background: #f7fafc;
  border-radius: 5px;
  color: #2d3748;
  min-height: 2.5rem;
  display: flex;
  align-items: center;
  word-break: break-all;
}

@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .modal-content-wide {
    max-width: 90%;
  }
}

/* Delete Confirmation Modal Styles */
.delete-confirm-modal {
  max-width: 450px;
}

.delete-confirm-modal .modal-header {
  margin-bottom: 1.5rem;
}

.delete-confirm-modal .modal-header h2 {
  margin: 0;
  color: #2d3748;
  font-size: 1.5rem;
}

.delete-confirm-modal .modal-body {
  margin-bottom: 1.5rem;
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

.delete-confirm-modal .modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 0;
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
</style>
