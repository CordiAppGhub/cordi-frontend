import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const COOKIE_NAME = 'corditrans_session';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000, 
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get(COOKIE_NAME);
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  // Tipamos el error con la estructura de NestJS
  (error: AxiosError<{ message: string; error: string; statusCode: number }>) => {
    
    // Extraemos el mensaje de tu backend
    const backendMessage = error.response?.data?.message || 'Ocurrió un error inesperado en el servidor';

    if (error.response?.status === 401) {
      console.error('🔒 Sesión expirada o no autorizada.');
      
      // 👈 SweetAlert para sesión expirada (Informativo)
      Swal.fire({
        icon: 'warning',
        title: 'Sesión Expirada',
        text: 'Tu sesión ha expirado. Por favor, ingresa de nuevo.',
        confirmButtonColor: '#3085d6',
      });
      
      Cookies.remove(COOKIE_NAME, { path: '/' });
      
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    } 
    // 👈 SweetAlert para rechazos del negocio (ej. El conductor ya tiene viaje)
    else if (error.response) {
      Swal.fire({
        icon: 'error',
        title: 'Acción rechazada',
        text: backendMessage,
        confirmButtonColor: '#d33', // Un botón rojo para indicar error
      });
    } 
    // 👈 SweetAlert para caídas del servidor o falta de internet
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