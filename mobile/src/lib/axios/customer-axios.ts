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
  getRefreshToken,
  saveAccessToken,
  getCustomerSessionId,
} from '@/lib/storage/secure_storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const AUTH_URL = `${API_BASE_URL}/api/v1/customer-session/user-service`;

export const customerAxios = create({
  baseURL: API_BASE_URL,
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

  // ✅ THÊM LOG
  console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL ?? ''}${config.url}`);
  console.log('[AUTH] hasToken:', Boolean(token));

  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshCustomerToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const sessionId = await getCustomerSessionId();
      const refreshToken = await getRefreshToken();

      if (!sessionId || !refreshToken) {
        throw new Error('Không tìm thấy thông tin refresh session!');
      }

      const response = await axios.post<RefreshResponse>(
        `${AUTH_URL}/refresh-access-token`,
        { session_id: sessionId, refresh_token: refreshToken },
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

// Response interceptor
customerAxios.interceptors.response.use(
  (response) => {
    console.log(`[API] ✅ ${response.status} ${response.config.url}`);
    return response;
  },

  async (error: AxiosError) => {
    console.log(`[API] ❌ ${error.response?.status ?? 'NO_RESPONSE'} ${error.config?.url}`);
    console.log('[API] error message:', error.response?.data);

    const originalRequest = error.config as RetryConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes("/refresh") ||
        originalRequest.url?.includes("/login")) {
      return Promise.reject(error);
    }

    console.log('[AUTH] 🔄 Token hết hạn, đang refresh...');
    originalRequest._retry = true;

    try {
      const newToken = await refreshCustomerToken();
      console.log('[AUTH] ✅ Refresh thành công');
      originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
      return customerAxios(originalRequest);
    } catch (refreshError) {
      console.log('[AUTH] ❌ Refresh thất bại, đuổi ra login');
      return Promise.reject(refreshError);
    }
  },
);
