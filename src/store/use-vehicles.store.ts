import { create } from 'zustand';
import { Vehicle } from '@/types/vehicles';

interface VehiclesState {
  vehicles: Vehicle[];
  isLoading: boolean;
  setVehicles: (vehicles: Vehicle[]) => void;
  setIsLoading: (loading: boolean) => void;
  addVehicle: (vehicle: Vehicle) => void;
  updateVehicleInStore: (id: number, updatedData: Partial<Vehicle>) => void;
  removeVehicleFromStore: (id: number) => void;
}

export const useVehiclesStore = create<VehiclesState>((set) => ({
  vehicles: [],
  isLoading: false,
  setVehicles: (vehicles) => set({ vehicles }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  addVehicle: (vehicle) => 
    set((state) => ({ vehicles: [...state.vehicles, vehicle] })),
    
  updateVehicleInStore: (id, updatedData) => 
    set((state) => ({
      vehicles: state.vehicles.map((v) => (v.id === id ? { ...v, ...updatedData } : v)),
    })),
    
  removeVehicleFromStore: (id) => 
    set((state) => ({
      vehicles: state.vehicles.filter((v) => v.id !== id),
    })),
}));