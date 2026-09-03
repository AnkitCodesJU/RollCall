import axios from 'axios';

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Send HttpOnly cookies with every request
});

// --- In-memory access token (never touches localStorage or cookies) ---
let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

// --- Auth event callbacks (registered by AuthContext) ---
let onRefreshSuccess = null;
let onRefreshFailed = null;

export const setOnRefreshSuccess = (callback) => {
  onRefreshSuccess = callback;
};

export const setOnRefreshFailed = (callback) => {
  onRefreshFailed = callback;
};

// --- Request Interceptor: attach in-memory access token ---
API.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// --- Response Interceptor: silent refresh + retry on 401 ---
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only intercept 401s that aren't retries and aren't auth endpoints
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register')
    ) {
      // If another refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return API(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint — cookie is sent automatically via withCredentials
        const { data } = await axios.post(
          `${API.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = data.accessToken;
        setAccessToken(newToken);

        // Notify AuthContext about the successful refresh
        if (onRefreshSuccess) {
          onRefreshSuccess(data);
        }

        // Retry all queued requests with the new token
        processQueue(null, newToken);

        // Retry the original failed request
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        // Refresh failed — clear token and notify AuthContext
        setAccessToken(null);
        processQueue(refreshError, null);

        if (onRefreshFailed) {
          onRefreshFailed();
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;
