import axios, {AxiosError, InternalAxiosRequestConfig} from "axios";

import {getAccessToken, setAccessToken} from "@/lib/access_token/access_token";

const AUTH_URL = "http://localhost:3001/api/v1/admin-session/user-service";

// Axios instance dùng chung cho các API Admin
export const adminAxios = axios.create({
  withCredentials: true,
  timeout: 10000,
});

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface RefreshResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
}

// Tự gắn Access Token vào request
adminAxios.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

// Chia sẻ một lần refresh giữa các request đồng thời
let refreshPromise: Promise<string> | null = null;

async function refreshAdminToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<RefreshResponse>(
        `${AUTH_URL}/refresh-access-token`, 
        {},
        {
          withCredentials: true,
          timeout: 10000,
        },
      )
      .then((response) => {
        const token = response.data.access_token;

        if (!token) {
          throw new Error("Không nhận được Access Token mới");
        }

        setAccessToken(token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

// Nếu nhận 401, refresh token rồi thử lại request ban đầu
adminAxios.interceptors.response.use((response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Không refresh nếu chính request refresh bị lỗi
    if (originalRequest.url?.includes("/refresh")) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newToken = await refreshAdminToken();

      originalRequest.headers.set("Authorization", `Bearer ${newToken}`,);

      return adminAxios(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);
