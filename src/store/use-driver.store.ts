import { create } from 'zustand';

import { Driver } from '@/types/drivers';

interface DriversState {
  drivers: Driver[];
  isLoading: boolean;

  setDrivers: (drivers: Driver[]) => void;
  setIsLoading: (loading: boolean) => void;

  addDriver: (driver: Driver) => void;

  updateDriverInStore: (
    id: number,
    updatedData: Partial<Driver>
  ) => void;

  removeDriverFromStore: (id: number) => void;
}

export const useDriversStore = create<DriversState>((set) => ({
  drivers: [],
  isLoading: false,

  setDrivers: (drivers) => set({ drivers }),

  setIsLoading: (isLoading) => set({ isLoading }),

  addDriver: (driver) =>
    set((state) => ({
      drivers: [...state.drivers, driver],
    })),

  updateDriverInStore: (id, updatedData) =>
    set((state) => ({
      drivers: state.drivers.map((driver) =>
        driver.id === id
          ? { ...driver, ...updatedData }
          : driver
      ),
    })),

  removeDriverFromStore: (id) =>
    set((state) => ({
      drivers: state.drivers.filter(
        (driver) => driver.id !== id
      ),
    })),
}));