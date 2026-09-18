import { create } from 'zustand';
import { Location, CreateLocationInput, UpdateLocationInput } from '@/types/location.types';
import { locationService } from '@/services/location.service';
import { useAuthStore } from './use-auth.store';

interface LocationState {
  locations: Location[];
  isLoadingLocations: boolean;
  error: string | null;

  fetchLocations: () => Promise<void>;
  createLocation: (data: Omit<CreateLocationInput, 'analystId'>) => Promise<void>;
  updateLocation: (id: number, data: UpdateLocationInput) => Promise<void>;
  deleteLocation: (id: number) => Promise<void>;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  locations: [],
  isLoadingLocations: false,
  error: null,

  fetchLocations: async () => {
    set({ isLoadingLocations: true, error: null });
    try {
      const data = await locationService.getAll();
      set({ locations: data, isLoadingLocations: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al obtener las ubicaciones';
      set({ isLoadingLocations: false, error: message });
    }
  },

  createLocation: async (data) => {
    set({ isLoadingLocations: true, error: null });
    try {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser?.id) throw new Error('No hay sesión activa');

      const dataToSend: CreateLocationInput = {
        ...data,
        analystId: Number(currentUser.id),
      };

      await locationService.create(dataToSend);
      await get().fetchLocations();
    } catch (err: unknown) {
      set({ isLoadingLocations: false });
      throw err;
    }
  },

  updateLocation: async (id, data) => {
    set({ isLoadingLocations: true, error: null });
    try {
      await locationService.update(id, data);
      await get().fetchLocations();
    } catch (err: unknown) {
      set({ isLoadingLocations: false });
      throw err;
    }
  },

  deleteLocation: async (id) => {
    set({ isLoadingLocations: true, error: null });
    try {
      await locationService.delete(id);
      await get().fetchLocations();
    } catch (err: unknown) {
      set({ isLoadingLocations: false });
      throw err;
    }
  },
}));