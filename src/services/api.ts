import axios, { type AxiosInstance } from 'axios';
import { useAuthStore } from '../stores/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
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
}

export default new ApiService();
