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

    const isIncompleteFleetAssignment =
      status === 400 &&
      error.response?.data?.message ===
        'ADVERTENCIA: El vehículo seleccionado no tiene un conductor o tráiler asignado.';

    if (status === 401) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const isLoginOrDriver =
          currentPath === '/login' ||
          currentPath === '/driver' ||
          currentPath.startsWith('/driver/');

        if (!isLoginOrDriver) {
          const redirectParam = encodeURIComponent(currentPath + window.location.search);
          window.location.assign(`/login?redirect=${redirectParam}`);
        }
      }
    } else if (!isIncompleteFleetAssignment) {
      showToast.error(error);
    }

    return Promise.reject(error);
  }
);
