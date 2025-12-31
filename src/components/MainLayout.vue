<template>
  <div class="main-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>My Console</h2>
        <div class="user-info">
          <span class="user-email">{{ authStore.userInfo?.email || authStore.user?.username || 'User' }}</span>
          <span class="user-role" v-if="currentRole" :class="`role-${currentRole}`">{{ getRoleDisplayName(currentRole) }}</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <!-- Main Menu Section -->
        <div class="nav-section">
          <router-link to="/dashboard" class="nav-item" active-class="active">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>대시보드</span>
          </router-link>

          <!-- Users menu (admin only, uses /api/v1/users) -->
          <router-link
            v-if="authStore.isAdminInCurrentOrg() && !authStore.isSystemAdmin()"
            to="/users"
            class="nav-item"
            active-class="active"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>사용자 관리</span>
          </router-link>

          <!-- Cloud Accounts menu (all authenticated users) -->
          <router-link
            to="/cloud-accounts"
            class="nav-item"
            active-class="active"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
            </svg>
            <span>클라우드 계정</span>
          </router-link>

          <!-- Honeypots menu (all authenticated users) -->
          <router-link
            to="/honeypots"
            class="nav-item"
            active-class="active"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
            <span>Honeypot 관리</span>
          </router-link>

          <!-- Honeypot Alert History menu (all authenticated users) -->
          <router-link
            to="/honeypot-alerts"
            class="nav-item"
            active-class="active"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span>Honeypot 알림</span>
          </router-link>
        </div>

        <!-- System Management Section (systemadmin only, uses /api/v1/admin/*) -->
        <div v-if="authStore.isSystemAdmin()" class="nav-section">
          <div class="nav-section-title">System Management</div>

          <router-link
            to="/system/organizations"
            class="nav-item"
            active-class="active"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>조직 관리</span>
          </router-link>

          <router-link
            to="/system/users"
            class="nav-item"
            active-class="active"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>조직 사용자 관리</span>
          </router-link>
        </div>
      </nav>

      <div class="sidebar-footer">
        <button @click="handleLogout" class="logout-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>로그아웃</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Top Header -->
      <header class="top-header">
        <div class="header-left">
          <!-- Placeholder for breadcrumbs or page title if needed -->
        </div>
        <div class="header-right">
          <!-- Organization Selector (only show if me API is called) -->
          <div v-if="authStore.shouldFetchMe && authStore.userInfo && authStore.userInfo.organizations && authStore.userInfo.organizations.length > 0" class="org-selector">
            <label for="orgSelect" class="org-label">조직:</label>
            <select
              id="orgSelect"
              v-model="selectedOrganizationId"
              @change="handleOrganizationChange"
              class="org-select"
              :disabled="isChangingOrg"
            >
              <option
                v-for="org in authStore.userInfo.organizations"
                :key="org.id"
                :value="org.id"
              >
                {{ org.name }}
              </option>
            </select>
          </div>

          <!-- User Info Icon (only show if me API is called) -->
          <button
            v-if="authStore.shouldFetchMe && authStore.userInfo"
            @click="openUserInfoModal"
            class="user-icon"
            title="사용자 정보"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </button>
        </div>
      </header>

      <router-view />
    </main>

    <!-- User Info Modal -->
    <div v-if="showUserInfoModal" class="modal-overlay" @click="closeUserInfoModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>사용자 정보 (GET /api/v1/me)</h2>
          <button @click="closeUserInfoModal" class="close-btn" title="닫기">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <!-- Error Message -->
          <div v-if="editError" class="error-message">
            {{ editError }}
          </div>

          <!-- Read-only Information -->
          <div class="info-card">
            <h3>기본 정보</h3>
            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">사용자 ID:</span>
                <span class="info-value">{{ authStore.userInfo?.id || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">이메일:</span>
                <span class="info-value">{{ authStore.userInfo?.email || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Cognito Sub:</span>
                <span class="info-value">{{ authStore.userInfo?.sub || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">최근 조직:</span>
                <span class="info-value">{{ getOrganizationName(authStore.userInfo?.recentOrganizationId) }}</span>
              </div>
            </div>
          </div>

          <!-- Editable Information -->
          <div class="info-card">
            <div class="card-header">
              <h3>상세 정보</h3>
              <button v-if="!isEditing" @click="startEdit" class="edit-btn" title="수정">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                수정
              </button>
            </div>

            <div v-if="!isEditing" class="info-grid">
              <div class="info-row">
                <span class="info-label">이름:</span>
                <span class="info-value">{{ authStore.userInfo?.name || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">전화번호:</span>
                <span class="info-value">{{ authStore.userInfo?.phoneNumber || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">타임존:</span>
                <span class="info-value">{{ authStore.userInfo?.timezone || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">언어:</span>
                <span class="info-value">{{ authStore.userInfo?.language || '-' }}</span>
              </div>
            </div>

            <div v-else class="edit-form">
              <div class="form-group">
                <label for="editName">이름 <span class="required">*</span></label>
                <input
                  id="editName"
                  v-model="editForm.name"
                  type="text"
                  placeholder="이름을 입력하세요"
                  required
                />
              </div>

              <div class="form-group">
                <label for="editPhoneNumber">전화번호</label>
                <input
                  id="editPhoneNumber"
                  v-model="editForm.phoneNumber"
                  type="tel"
                  placeholder="전화번호를 입력하세요"
                />
              </div>

              <div class="form-group">
                <label for="editTimezone">타임존</label>
                <select id="editTimezone" v-model="editForm.timezone">
                  <option value="UTC+9">UTC+9 (한국)</option>
                  <option value="UTC+0">UTC+0 (GMT)</option>
                  <option value="UTC-5">UTC-5 (EST)</option>
                  <option value="UTC-8">UTC-8 (PST)</option>
                </select>
              </div>

              <div class="form-group">
                <label for="editLanguage">언어</label>
                <select id="editLanguage" v-model="editForm.language">
                  <option value="ko">한국어</option>
                  <option value="en">English</option>
                  <option value="ja">日本語</option>
                </select>
              </div>

              <div class="form-actions">
                <button @click="saveUserInfo" :disabled="isChangingOrg || !editForm.name" class="save-btn">
                  {{ isChangingOrg ? '저장 중...' : '저장' }}
                </button>
                <button @click="cancelEdit" :disabled="isChangingOrg" class="cancel-btn">
                  취소
                </button>
              </div>
            </div>
          </div>

          <!-- Organizations Information -->
          <div v-if="authStore.userInfo?.organizations && authStore.userInfo.organizations.length > 0" class="info-card">
            <h3>소속 조직</h3>
            <div class="orgs-table">
              <table>
                <thead>
                  <tr>
                    <th>조직명</th>
                    <th>조직 ID</th>
                    <th>역할</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="org in authStore.userInfo.organizations" :key="org.id">
                    <td class="org-name">{{ org.name }}</td>
                    <td class="org-id">{{ org.id }}</td>
                    <td class="org-role">{{ getUserRoleInOrg(org.id) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import apiService from '../services/api';

const router = useRouter();
const authStore = useAuthStore();

const currentRole = computed(() => authStore.getCurrentOrganizationRole());
const selectedOrganizationId = ref<string>('');
const isChangingOrg = ref(false);
const showUserInfoModal = ref(false);

// User info editing
const isEditing = ref(false);
const editError = ref<string | null>(null);
const editForm = ref({
  name: '',
  phoneNumber: '',
  timezone: '',
  language: '',
});

// Initialize selected organization when userInfo is available
watch(
  () => authStore.userInfo,
  (userInfo) => {
    if (userInfo && userInfo.recentOrganizationId) {
      selectedOrganizationId.value = userInfo.recentOrganizationId;
    }
  },
  { immediate: true }
);

function openUserInfoModal() {
  if (authStore.shouldFetchMe && authStore.userInfo) {
    isEditing.value = false;
    editError.value = null;
    showUserInfoModal.value = true;
  }
}

function closeUserInfoModal() {
  showUserInfoModal.value = false;
  isEditing.value = false;
  editError.value = null;
}

function startEdit() {
  if (!authStore.userInfo) return;

  editForm.value = {
    name: authStore.userInfo.name || '',
    phoneNumber: authStore.userInfo.phoneNumber || '',
    timezone: authStore.userInfo.timezone || 'UTC+9',
    language: authStore.userInfo.language || 'ko',
  };

  editError.value = null;
  isEditing.value = true;
}

function cancelEdit() {
  isEditing.value = false;
  editError.value = null;
}

async function saveUserInfo() {
  editError.value = null;

  if (!editForm.value.name || editForm.value.name.trim() === '') {
    editError.value = '이름은 필수 항목입니다.';
    return;
  }

  isChangingOrg.value = true;

  try {
    const updateData = {
      name: editForm.value.name.trim(),
      phoneNumber: editForm.value.phoneNumber || undefined,
      timezone: editForm.value.timezone || undefined,
      language: editForm.value.language || undefined,
    };

    await apiService.updateUserInfo(updateData);

    // Refresh user info
    const userInfo = await apiService.getCurrentUser();
    authStore.setUserInfo(userInfo);

    isEditing.value = false;
    alert('사용자 정보가 성공적으로 업데이트되었습니다!');
  } catch (err: any) {
    editError.value = err.response?.data?.message || err.message || '정보 업데이트에 실패했습니다.';
    console.error('Update user info error:', err);
  } finally {
    isChangingOrg.value = false;
  }
}

function getOrganizationName(orgId: string): string {
  if (!authStore.userInfo || !authStore.userInfo.organizations) return orgId;
  const org = authStore.userInfo.organizations.find((o: any) => o.id === orgId);
  return org ? org.name : orgId;
}

function getUserRoleInOrg(orgId: string): string {
  if (!authStore.userInfo || !authStore.userInfo.organizationRoles) return '-';
  const roleObj = authStore.userInfo.organizationRoles.find((r: any) => r.organizationId === orgId);
  if (!roleObj) return '-';

  const roleMap: Record<string, string> = {
    systemadmin: '시스템 관리자',
    admin: '관리자',
    user: '사용자',
  };
  return roleMap[roleObj.role] || roleObj.role;
}

function getRoleDisplayName(role: string): string {
  const roleMap: Record<string, string> = {
    systemadmin: '시스템 관리자',
    admin: '관리자',
    user: '사용자',
  };
  return roleMap[role] || role;
}

async function handleOrganizationChange() {
  if (!selectedOrganizationId.value) {
    return;
  }

  // Check if organization actually changed
  if (authStore.userInfo && selectedOrganizationId.value === authStore.userInfo.recentOrganizationId) {
    return;
  }

  const confirmed = confirm('조직을 변경하시겠습니까? 변경 후 화면이 새로고침됩니다.');
  if (!confirmed) {
    // Revert selection
    if (authStore.userInfo) {
      selectedOrganizationId.value = authStore.userInfo.recentOrganizationId;
    }
    return;
  }

  isChangingOrg.value = true;

  try {
    await apiService.switchOrganization(selectedOrganizationId.value);

    // Refresh user info to get updated organization data
    const userInfo = await apiService.getCurrentUser();
    authStore.setUserInfo(userInfo);

    alert('조직이 성공적으로 변경되었습니다!');

    // Reload the page to refresh all data
    window.location.reload();
  } catch (err: any) {
    alert(err.response?.data?.message || err.message || '조직 변경에 실패했습니다.');
    console.error('Switch organization error:', err);

    // Revert selection on error
    if (authStore.userInfo) {
      selectedOrganizationId.value = authStore.userInfo.recentOrganizationId;
    }
  } finally {
    isChangingOrg.value = false;
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
</script>

<style scoped>
.main-layout {
  display: flex;
  min-height: 100vh;
  background: #f7fafc;
}

.sidebar {
  width: 260px;
  background: linear-gradient(180deg, #2d3748 0%, #1a202c 100%);
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-header h2 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  color: #fff;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.user-email {
  font-size: 0.85rem;
  font-weight: 500;
  color: #e2e8f0;
  word-break: break-word;
}

.user-role {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  width: fit-content;
  margin-top: 0.25rem;
}

/* Role-specific colors for sidebar */
.user-role.role-systemadmin {
  background: #fed7aa;
  color: #7c2d12;
}

.user-role.role-admin {
  background: #ddd6fe;
  color: #5b21b6;
}

.user-role.role-user {
  background: #bfdbfe;
  color: #1e3a8a;
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0;
  overflow-y: auto;
}

.nav-section {
  margin-bottom: 1.5rem;
}

.nav-section-title {
  padding: 0.5rem 1.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #a0aec0;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.5rem;
  color: #cbd5e0;
  text-decoration: none;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.nav-item.active {
  background: rgba(102, 126, 234, 0.15);
  color: #fff;
  border-left-color: #667eea;
}

.nav-item svg {
  flex-shrink: 0;
}

.sidebar-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem;
  background: rgba(229, 62, 62, 0.1);
  color: #fc8181;
  border: 1px solid rgba(229, 62, 62, 0.2);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
  font-weight: 500;
}

.logout-btn:hover {
  background: rgba(229, 62, 62, 0.2);
  border-color: rgba(229, 62, 62, 0.3);
}

.main-content {
  flex: 1;
  margin-left: 260px;
  min-height: 100vh;
  width: calc(100vw - 260px);
  max-width: calc(100vw - 260px);
  box-sizing: border-box;
  text-align: left;
  display: flex;
  flex-direction: column;
}

.top-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.org-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.org-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #4a5568;
  white-space: nowrap;
}

.org-select {
  padding: 0.5rem 1rem;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  color: #2d3748;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 200px;
}

.org-select:hover:not(:disabled) {
  border-color: #667eea;
}

.org-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.org-select:disabled {
  background: #f7fafc;
  cursor: not-allowed;
  opacity: 0.6;
}

.user-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f7fafc;
  color: #667eea;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
}

.user-icon:hover {
  background: #667eea;
  color: white;
  transform: scale(1.05);
}

.main-content > :not(.top-header) {
  padding: 1.5rem;
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
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
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
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #718096;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  padding: 0;
}

.close-btn:hover {
  background: #f7fafc;
  color: #2d3748;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

/* Info Card Styles */
.info-card {
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.info-card:last-child {
  margin-bottom: 0;
}

.info-card h3 {
  margin: 0 0 1rem 0;
  color: #2d3748;
  font-size: 1.1rem;
  font-weight: 600;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h3 {
  margin: 0;
}

.edit-btn {
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
}

.edit-btn:hover {
  background: #5568d3;
  transform: translateY(-1px);
}

.info-grid {
  display: grid;
  gap: 0.75rem;
}

.info-row {
  display: flex;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e2e8f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: #4a5568;
  min-width: 140px;
  flex-shrink: 0;
}

.info-value {
  color: #2d3748;
  flex: 1;
  word-break: break-word;
}

/* Edit Form Styles */
.edit-form {
  margin-top: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #4a5568;
  font-weight: 500;
  font-size: 0.9rem;
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
  font-size: 0.9rem;
  box-sizing: border-box;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.save-btn {
  flex: 1;
  padding: 0.75rem;
  background: #48bb78;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn:hover:not(:disabled) {
  background: #38a169;
  transform: translateY(-1px);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  flex: 1;
  padding: 0.75rem;
  background: #e2e8f0;
  color: #4a5568;
  border: none;
  border-radius: 5px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover:not(:disabled) {
  background: #cbd5e0;
}

.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Organizations Table */
.orgs-table {
  overflow-x: auto;
}

.orgs-table table {
  width: 100%;
  border-collapse: collapse;
}

.orgs-table th {
  background: #edf2f7;
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #4a5568;
  font-size: 0.875rem;
  border-bottom: 2px solid #cbd5e0;
}

.orgs-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  color: #2d3748;
  font-size: 0.875rem;
}

.orgs-table tbody tr:hover {
  background: #edf2f7;
}

.orgs-table tbody tr:last-child td {
  border-bottom: none;
}

.org-name {
  font-weight: 600;
  color: #2d3748;
}

.org-id {
  font-family: 'Courier New', monospace;
  color: #718096;
  font-size: 0.8rem;
}

.org-role {
  color: #667eea;
  font-weight: 500;
}

/* Error Message */
.error-message {
  color: #e53e3e;
  background: #fff5f5;
  padding: 0.75rem;
  border-radius: 5px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  border: 1px solid #feb2b2;
}

/* Scrollbar styling */
.sidebar-nav::-webkit-scrollbar {
  width: 6px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
