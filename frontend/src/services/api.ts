import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      
      if (refreshToken) {
        try {
          // Try to refresh token
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data.data;
          useAuthStore.getState().updateTokens(accessToken);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          useAuthStore.getState().logout();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, logout user
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }

    // Handle other errors
    if (error.response) {
      const errorData = error.response.data as any;
      const message = errorData?.error?.message || 'An error occurred';
      
      // Don't show toast for 401 errors (handled above)
      if (error.response.status !== 401) {
        toast.error(message);
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

// API methods
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (data: { email: string; password: string; firstName?: string; lastName?: string }) =>
    api.post('/auth/register', data),
  
  logout: () => api.post('/auth/logout'),
  
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  
  getMe: () => api.get('/auth/me'),
  
  updateMe: (data: Partial<any>) => api.put('/auth/me', data),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

export const tradesApi = {
  getAll: (params?: any) => api.get('/trades', { params }),
  
  getById: (id: string) => api.get(`/trades/${id}`),
  
  create: (data: any) => api.post('/trades', data),
  
  update: (id: string, data: any) => api.put(`/trades/${id}`, data),
  
  delete: (id: string) => api.delete(`/trades/${id}`),
  
  addExit: (id: string, data: any) => api.post(`/trades/${id}/exit`, data),
  
  getStatistics: (params?: any) => api.get('/trades/statistics', { params }),
  
  getSymbols: () => api.get('/trades/symbols'),
  
  getTags: () => api.get('/trades/tags'),
  
  getEquityCurve: (params?: any) => api.get('/trades/equity-curve', { params }),
};

export const portfolioApi = {
  getAll: (params?: any) => api.get('/portfolios', { params }),
  
  getById: (id: string) => api.get(`/portfolios/${id}`),
  
  getDefault: () => api.get('/portfolios/default'),
  
  create: (data: any) => api.post('/portfolios', data),
  
  update: (id: string, data: any) => api.put(`/portfolios/${id}`, data),
  
  delete: (id: string) => api.delete(`/portfolios/${id}`),
  
  addHolding: (id: string, data: any) =>
    api.post(`/portfolios/${id}/holdings`, data),
  
  updateHolding: (id: string, symbol: string, data: any) =>
    api.put(`/portfolios/${id}/holdings/${symbol}`, data),
  
  removeHolding: (id: string, symbol: string) =>
    api.delete(`/portfolios/${id}/holdings/${symbol}`),
  
  depositCash: (id: string, amount: number) =>
    api.post(`/portfolios/${id}/cash/deposit`, { amount }),
  
  withdrawCash: (id: string, amount: number) =>
    api.post(`/portfolios/${id}/cash/withdraw`, { amount }),
  
  updatePrices: (id: string, prices: Record<string, number>) =>
    api.post(`/portfolios/${id}/prices`, { prices }),
  
  getPerformance: (id: string) => api.get(`/portfolios/${id}/performance`),
};

export const aiApi = {
  analyzeTrade: (tradeId: string) =>
    api.post('/ai/analyze-trade', { tradeId }),
  
  detectPatterns: (tradeIds?: string[]) =>
    api.post('/ai/detect-patterns', { tradeIds }),
  
  analyzeJournal: (entries: any[]) =>
    api.post('/ai/analyze-journal', { entries }),
  
  getStrategyFeedback: (strategy: any, tradeIds?: string[]) =>
    api.post('/ai/strategy-feedback', { strategy, tradeIds }),
  
  evaluateRisk: (portfolio?: any) =>
    api.post('/ai/evaluate-risk', { portfolio }),
  
  getTradeInsights: (tradeId: string) =>
    api.get(`/ai/trades/${tradeId}/insights`),
};

export default api;
