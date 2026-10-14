import axios, { type AxiosError } from 'axios';
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

    if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
      return Promise.reject(error);
    }

    if (status !== 401) {
      showToast.error(error);
    }

    return Promise.reject(error);
  }
);