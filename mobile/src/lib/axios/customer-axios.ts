import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  create,
} from 'axios';
import {
  getAccessToken,
  setAccessToken,
} from '@/lib/access_token/customer_access_token';
import {
  getAccessToken as getStoredAccessToken,
  saveAccessToken,
  getCustomerSessionId,
} from '@/lib/storage/secure_storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const AUTH_URL = `${API_BASE_URL}/api/v1/customer-session/user-service`;

export const customerAxios = create({
  baseURL: AUTH_URL,
  withCredentials: true,
  timeout: 10_000,
});

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface RefreshResponse {
  access_token: string;
}

customerAxios.interceptors.request.use(async (config) => {
  const token =
    getAccessToken() ?? (await getStoredAccessToken());

  if (token) {
    setAccessToken(token);
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshCustomerToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const sessionId = await getCustomerSessionId();

      if (!sessionId) {
        throw new Error('Không tìm thấy customer session_id!');
      }

      const response = await axios.post<RefreshResponse>(
        `${AUTH_URL}/refresh-access-token`,
        { session_id: sessionId },
        { withCredentials: true, timeout: 10_000 },
      );

      if (!response.data.access_token) {
        throw new Error('Không nhận được Access Token mới');
      }

      setAccessToken(response.data.access_token);
      await saveAccessToken(response.data.access_token);
      return response.data.access_token;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

customerAxios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes('/refresh-access-token') ||
      originalRequest.url?.includes('/login')
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newToken = await refreshCustomerToken();
      originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
      return customerAxios(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);
