import { create } from 'zustand';
import Swal from 'sweetalert2';
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
    } catch (err: any) {
      set({ isLoadingLocations: false, error: err.message });
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
      await get().fetchLocations(); // Recargamos la lista
      
      Swal.fire({
        icon: 'success',
        title: 'Empresa Creada',
        text: 'La nueva ubicación ha sido registrada exitosamente.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err: any) {
      set({ isLoadingLocations: false });
      // El error de conflicto (nombre repetido) lo debería atajar el interceptor de tu api.service
      throw err; 
    }
  },

  updateLocation: async (id, data) => {
    set({ isLoadingLocations: true, error: null });
    try {
      await locationService.update(id, data);
      await get().fetchLocations();
      
      Swal.fire({
        icon: 'success',
        title: 'Empresa Actualizada',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err: any) {
      set({ isLoadingLocations: false });
      throw err;
    }
  },

  deleteLocation: async (id) => {
    try {
      // Confirmación antes de borrar
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "No podrás revertir esto. Si la empresa tiene viajes, no se podrá borrar.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        set({ isLoadingLocations: true });
        await locationService.delete(id);
        await get().fetchLocations();
        
        Swal.fire('Eliminada', 'La empresa ha sido eliminada.', 'success');
      }
    } catch (err: any) {
      set({ isLoadingLocations: false });
      throw err;
    }
  }
}));