import axios, { type AxiosInstance } from 'axios';
import { useAuthStore } from '../stores/auth';

// API 서버 환경 설정
export type ApiEnvironment = 'local' | 'dev';

const API_URLS: Record<ApiEnvironment, string> = {
  local: import.meta.env.VITE_API_BASE_URL_LOCAL || 'http://localhost:3000',
  dev: import.meta.env.VITE_API_BASE_URL_DEV || 'http://localhost:3000',
};

// localStorage에서 선택된 환경 가져오기
const STORAGE_KEY = 'api_environment';

function getStoredEnvironment(): ApiEnvironment {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'local' || stored === 'dev') {
    return stored;
  }
  return 'local'; // 기본값
}

function getApiBaseUrl(): string {
  const env = getStoredEnvironment();
  return API_URLS[env];
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: getApiBaseUrl(),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        try {
          const authStore = useAuthStore();
          const accessToken = authStore.getAccessToken();

          if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
            console.log('Authorization Bearer token (Access Token) added to request');
            console.log('Token preview:', accessToken.substring(0, 20) + '...');
          } else {
            console.warn('No access token available');
          }
        } catch (error) {
          console.error('Error getting auth token:', error);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  // Get current user info from scarif-hapi
  async getCurrentUser() {
    const response = await this.api.get('/api/v1/me');
    return response.data;
  }

  // Update user basic information
  async updateUserInfo(data: {
    name: string;
    phoneNumber?: string;
    timezone?: string;
    language?: string;
  }) {
    const response = await this.api.put('/api/v1/me', data);
    return response.data;
  }

  // Switch user's organization
  async switchOrganization(organizationId: string) {
    const response = await this.api.patch('/api/v1/me', { organizationId });
    return response.data;
  }

  // ============ Organizations API ============
  // List organizations
  async listOrganizations() {
    const response = await this.api.get('/api/v1/organizations');
    return response.data;
  }

  // Get organization by ID
  async getOrganization(organizationId: string) {
    const response = await this.api.get(`/api/v1/organizations/${organizationId}`);
    return response.data;
  }

  // Update organization (systemadmin/admin only)
  async updateOrganization(organizationId: string, data: { name: string; description?: string }) {
    const response = await this.api.put(`/api/v1/organizations/${organizationId}`, data);
    return response.data;
  }

  // Delete organization (systemadmin only)
  async deleteOrganization(organizationId: string) {
    const response = await this.api.delete(`/api/v1/organizations/${organizationId}`);
    return response.data;
  }

  // ============ Admin Organizations API (systemadmin only) ============
  // List all organizations (admin view)
  async adminListOrganizations() {
    const response = await this.api.get('/api/v1/admin/organizations');
    return response.data;
  }

  // Create organization (systemadmin only)
  async createOrganization(data: { name: string; description?: string }) {
    const response = await this.api.post('/api/v1/admin/organizations', data);
    return response.data;
  }

  // Get organization (admin view)
  async adminGetOrganization(organizationId: string) {
    const response = await this.api.get(`/api/v1/admin/organizations/${organizationId}`);
    return response.data;
  }

  // Update organization (admin view)
  async adminUpdateOrganization(organizationId: string, data: { name: string; description?: string }) {
    const response = await this.api.put(`/api/v1/admin/organizations/${organizationId}`, data);
    return response.data;
  }

  // Delete organization (systemadmin only)
  async adminDeleteOrganization(organizationId: string) {
    const response = await this.api.delete(`/api/v1/admin/organizations/${organizationId}`);
    return response.data;
  }

  // ============ Users API ============
  // List users in organization
  async listUsers(organizationId: string) {
    const response = await this.api.get('/api/v1/users', {
      params: { organizationId }
    });
    return response.data;
  }

  // Get user by ID
  async getUser(userId: string, organizationId?: string) {
    const response = await this.api.get(`/api/v1/users/${userId}`, {
      params: organizationId ? { organizationId } : undefined
    });
    return response.data;
  }

  // Create user
  async createUser(organizationId: string, data: {
    email: string;
    name: string;
    phoneNumber?: string;
    roles?: string[];
    mfaMandatory?: boolean;
    timezone?: string;
    language?: string;
  }) {
    const response = await this.api.post('/api/v1/users', data, {
      params: { organizationId }
    });
    return response.data;
  }

  // Update user
  async updateUser(userId: string, data: {
    name?: string;
    phoneNumber?: string;
    timezone?: string;
    language?: string;
    roles?: string[];
  }, organizationId?: string) {
    const response = await this.api.put(`/api/v1/users/${userId}`, data, {
      params: organizationId ? { organizationId } : undefined
    });
    return response.data;
  }

  // Delete user
  async deleteUser(userId: string) {
    const response = await this.api.delete(`/api/v1/users/${userId}`);
    return response.data;
  }

  // Reset user password
  async resetUserPassword(userId: string, organizationId?: string) {
    const response = await this.api.post(`/api/v1/users/${userId}/resetPassword`, {}, {
      params: organizationId ? { organizationId } : undefined
    });
    return response.data;
  }

  // Invite user
  async inviteUser(userId: string, organizationId: string) {
    const response = await this.api.post(`/api/v1/users/${userId}/invite`, {}, {
      params: { organizationId }
    });
    return response.data;
  }

  // Delete user MFA (admin only)
  async deleteUserMFA(userId: string, organizationId: string) {
    const response = await this.api.delete(`/api/v1/users/${userId}/mfa`, {
      params: { organizationId }
    });
    return response.data;
  }

  // ============ Admin Users API (systemadmin only) ============
  // List all users (admin view)
  async adminListUsers(organizationId?: string) {
    const response = await this.api.get('/api/v1/admin/users', {
      params: organizationId ? { organizationId } : undefined
    });
    return response.data;
  }

  // Create user (admin)
  async adminCreateUser(organizationId: string, data: {
    email: string;
    name: string;
    phoneNumber?: string;
    roles?: string[];
    mfaMandatory?: boolean;
    timezone?: string;
    language?: string;
  }) {
    const response = await this.api.post('/api/v1/admin/users', data, {
      params: { organizationId }
    });
    return response.data;
  }

  // Delete user (admin)
  async adminDeleteUser(userId: string, organizationId?: string) {
    const response = await this.api.delete(`/api/v1/admin/users/${userId}`, {
      params: organizationId ? { organizationId } : undefined
    });
    return response.data;
  }

  // Invite admin user (systemadmin only)
  async inviteAdminUser(userId: string) {
    const response = await this.api.post(`/api/v1/admin/users/${userId}/invite`);
    return response.data;
  }

  // Reset user password (admin)
  async adminResetUserPassword(userId: string) {
    const response = await this.api.post(`/api/v1/admin/users/${userId}/resetPassword`);
    return response.data;
  }

  // ============ Cloud Accounts API ============
  // List cloud accounts
  async listCloudAccounts(params?: {
    organizationId?: string;
    provider?: 'AWS' | 'AZURE' | 'GCP';
    status?: string;
  }) {
    const response = await this.api.get('/api/v1/cloud_accounts', { params });
    return response.data;
  }

  // Get cloud account by ID
  async getCloudAccount(cloudAccountId: string) {
    const response = await this.api.get(`/api/v1/cloud_accounts/${cloudAccountId}`);
    return response.data;
  }

  // Create cloud account
  async createCloudAccount(data: {
    provider: 'AWS' | 'AZURE' | 'GCP';
    name: string;
    type?: 'single' | 'master' | 'member';
    subType?: string;
    masterAccountId?: string;
    accessProperties: any;
  }) {
    const response = await this.api.post('/api/v1/cloud_accounts', data);
    return response.data;
  }

  // Update cloud account
  async updateCloudAccount(cloudAccountId: string, data: {
    name?: string;
    status?: 'active' | 'inactive';
    accessProperties?: any;
  }) {
    const response = await this.api.put(`/api/v1/cloud_accounts/${cloudAccountId}`, data);
    return response.data;
  }

  // Delete cloud account
  async deleteCloudAccount(cloudAccountId: string) {
    const response = await this.api.delete(`/api/v1/cloud_accounts/${cloudAccountId}`);
    return response.data;
  }

  // ============ Honeypot Alert History API ============
  // Search honeypot alert history
  async searchHoneypotAlertHistory(data: {
    period?: {
      startDate?: string;
      endDate?: string;
    };
    conditions?: Array<{
      key: string;
      operator: string;
      value: string[];
    }>;
    orderBy?: string;
    sort?: string;
    offset?: number;
    limit?: number;
  }) {
    const response = await this.api.post('/api/v1/honeypot_alert_histories/search', data);
    return response.data;
  }

  // Get filter options for honeypot alert history
  async getHoneypotAlertHistoryFilters(data: {
    filterKey: string;
    conditions?: Array<{
      key: string;
      operator: string;
      value: string[];
    }>;
    period?: {
      startDate?: string;
      endDate?: string;
    };
  }) {
    const response = await this.api.post('/api/v1/honeypot_alert_histories/filters', data);
    return response.data;
  }

  // Get honeypot alert history by ID
  async getHoneypotAlertHistoryById(alertId: string) {
    const response = await this.api.get(`/api/v1/honeypot_alert_histories/${alertId}`);
    return response.data;
  }

  // ============ Honeypots API ============
  // List honeypots
  async listHoneypots(params?: {
    cloudAccountId?: string;
    status?: string;
  }) {
    const response = await this.api.get('/api/v1/honeypots', { params });
    return response.data;
  }

  // Get honeypot by ID
  async getHoneypot(honeypotId: string) {
    const response = await this.api.get(`/api/v1/honeypots/${honeypotId}`);
    return response.data;
  }

  // Create honeypot
  async createHoneypot(data: {
    cloudAccountId: string;
    csp: string;
    name: string;
    instanceId: string;
    networkMode: 'default' | 'custom';
    networkSpec?: {
      vpcId?: string;
      subnetId?: string;
      securityGroupId?: string;
    };
    spec?: Record<string, any>;
  }) {
    const response = await this.api.post('/api/v1/honeypots', data);
    return response.data;
  }

  // Update honeypot
  async updateHoneypot(honeypotId: string, data: {
    name?: string;
    description?: string;
  }) {
    const response = await this.api.patch(`/api/v1/honeypots/${honeypotId}`, data);
    return response.data;
  }

  // Delete honeypot
  async deleteHoneypot(honeypotId: string) {
    const response = await this.api.delete(`/api/v1/honeypots/${honeypotId}`);
    return response.data;
  }

  // API 환경 변경
  setEnvironment(env: ApiEnvironment) {
    localStorage.setItem(STORAGE_KEY, env);
    this.api.defaults.baseURL = API_URLS[env];
    console.log(`API environment changed to: ${env} (${API_URLS[env]})`);
  }

  // 현재 환경 가져오기
  getEnvironment(): ApiEnvironment {
    return getStoredEnvironment();
  }

  // 현재 baseURL 가져오기
  getBaseUrl(): string {
    return this.api.defaults.baseURL || getApiBaseUrl();
  }

  // 사용 가능한 환경 목록
  getAvailableEnvironments(): { key: ApiEnvironment; label: string; url: string }[] {
    return [
      { key: 'local', label: 'Local', url: API_URLS.local },
      { key: 'dev', label: 'Dev', url: API_URLS.dev },
    ];
  }
}

export default new ApiService();
