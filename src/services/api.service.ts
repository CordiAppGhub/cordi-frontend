import axios, { AxiosError, AxiosResponse } from 'axios';
import Swal from 'sweetalert2';
import { useUIStore } from '@/store/use-ui.store';

const API_BASE_URL = '/api';
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  useUIStore.getState().startLoading();
  return config;
}, (error) => {
  useUIStore.getState().stopLoading();
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response: AxiosResponse) => {
    useUIStore.getState().stopLoading();
    return response;
  },
  (error: AxiosError<{ message: string | string[]; error: string; statusCode: number }>) => {
    useUIStore.getState().stopLoading();

    const status = error.response?.status;
    const backendMessage = error.response?.data?.message;

    if (status === 401) {
      console.error('🔒 Petición no autorizada:', {
        url: error.config?.url,
        method: error.config?.method,
        status,
      });
      return Promise.reject(error);
    }

    if (error.response) {
      const message = Array.isArray(backendMessage) 
        ? backendMessage.join(', ') 
        : backendMessage || 'Ocurrió un error inesperado en el servidor';
        
      Swal.fire({
        icon: 'error', 
        title: 'Acción rechazada',
        text: message, 
        confirmButtonColor: '#d33',
      });
    } else {
      Swal.fire({ 
        icon: 'error', 
        title: 'Error de conexión', 
        text: 'No se pudo conectar con el servidor principal.', 
        confirmButtonColor: '#d33', 
      }); 
    }

    return Promise.reject(error);
  }
);