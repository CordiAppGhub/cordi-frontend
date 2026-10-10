import { create } from 'zustand';
import { DriverPortalData } from '@/types/driver-portal.types';

interface DriverAuthStore {
  isAuthenticated: boolean;
  authStep: 'CEDULA' | 'OTP';
  driver: DriverPortalData | null;

  setAuthStep: (step: 'CEDULA' | 'OTP') => void;
  setLoginSuccess: (driverData: DriverPortalData) => void;
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