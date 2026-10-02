import { create } from 'zustand';

interface Driver {
  id: number;
  name: string;
  cedula: string;
  role: string;
  isActive: boolean;
  [key: string]: any; 
}

interface DriverAuthStore {
  isAuthenticated: boolean;
  authStep: 'CEDULA' | 'OTP';
  driver: Driver | null;

  setAuthStep: (step: 'CEDULA' | 'OTP') => void;
  setLoginSuccess: (driverData: Driver) => void;
  logout: () => void;
}

export const useDriverAuthStore = create<DriverAuthStore>((set) => ({
  isAuthenticated: false,
  authStep: 'CEDULA',
  driver: null,

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