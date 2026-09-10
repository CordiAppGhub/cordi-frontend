import axios, { AxiosError, AxiosResponse } from 'axios';
import Swal from 'sweetalert2';

// 🔥 MAGIA AQUÍ: Ahora Axios le pega al propio Next.js, 
// y Next.js lo reenvía al backend llevándose la cookie de forma nativa.
const API_BASE_URL = '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000, 
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<{ message: string; error: string; statusCode: number }>) => {
    
    const backendMessage = error.response?.data?.message || 'Ocurrió un error inesperado en el servidor';

    if (error.response?.status === 401) {
      console.error('🔒 Sesión expirada o no autorizada.');
      
      Swal.fire({
        icon: 'warning',
        title: 'Sesión Expirada',
        text: 'Tu sesión ha expirado. Por favor, ingresa de nuevo.',
        confirmButtonColor: '#3085d6',
      });
      
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    } 
    else if (error.response) {
      Swal.fire({
        icon: 'error',
        title: 'Acción rechazada',
        text: backendMessage,
        confirmButtonColor: '#d33', 
      });
    } 
    else {
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