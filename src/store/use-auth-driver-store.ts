import { create } from 'zustand';

// Puedes ajustar 'Driver' con la interfaz exacta que tengas en tus types
interface Driver {
  id: number;
  name: string;
  cedula: string;
  role: string;
  isActive: boolean;
  [key: string]: any; 
}

interface DriverAuthStore {
  // 1. Estados
  isAuthenticated: boolean;
  authStep: 'CEDULA' | 'OTP';
  driver: Driver | null;

  // 2. Acciones
  setAuthStep: (step: 'CEDULA' | 'OTP') => void;
  setLoginSuccess: (driverData: Driver) => void;
  logout: () => void;
}

export const useDriverAuthStore = create<DriverAuthStore>((set) => ({
  // Valores iniciales
  isAuthenticated: false,
  authStep: 'CEDULA',
  driver: null,

  // Funciones para actualizar el estado
  setAuthStep: (step) => set({ authStep: step }),
  
  setLoginSuccess: (driverData) => set({ 
    isAuthenticated: true, 
    driver: driverData,
    authStep: 'CEDULA'
  }),

  logout: () => set({ 
    isAuthenticated: false, 
    driver: null, 
    authStep: 'CEDULA' 
  }),
}));