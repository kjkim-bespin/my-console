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
}

export default new ApiService();
