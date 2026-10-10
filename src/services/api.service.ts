import axios, { type AxiosError } from 'axios';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';
import { showToast } from '@/utils/alerts';

const API_BASE_URL = '/api';
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message: string | string[]; error: string; statusCode: number }>) => {
    const status = error.response?.status;

    if (error.response?.data) {
      error.response.data.message = getUserFriendlyErrorMessage(error);
    }

    if (status === 401) {
      console.error('🔒 Petición no autorizada:', {
        url: error.config?.url,
        method: error.config?.method,
        status,
      });
      return Promise.reject(error);
    }

    showToast.error(error);
    return Promise.reject(error);
  }
);