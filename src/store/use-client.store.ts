import { clientService } from '@/services/client-service';
import { Client, CreateClientInput, UpdateClientInput } from '@/types/client.-types';
import { create } from 'zustand';


interface ClientState {
  clients: Client[];
  isLoadingClients: boolean;
  error: string | null;
  fetchClients: () => Promise<void>;
  createClient: (data: CreateClientInput) => Promise<void>;
  updateClient: (id: number, data: UpdateClientInput) => Promise<void>;
  deleteClient: (id: number) => Promise<void>;
}

export const useClientStore = create<ClientState>((set, get) => ({
  clients: [],
  isLoadingClients: false,
  error: null,

  fetchClients: async () => {
    set({ isLoadingClients: true, error: null });
    try {
      const data = await clientService.getAll();
      set({ clients: data, isLoadingClients: false });
    } catch (err: any) {
      set({ isLoadingClients: false, error: err.message || 'Error al cargar clientes' });
    }
  },

  createClient: async (data) => {
    set({ isLoadingClients: true, error: null });
    try {
      await clientService.create(data);
      await get().fetchClients();
    } catch (err) {
      set({ isLoadingClients: false });
      throw err;
    }
  },

  updateClient: async (id, data) => {
    set({ isLoadingClients: true, error: null });
    try {
      await clientService.update(id, data);
      await get().fetchClients();
    } catch (err) {
      set({ isLoadingClients: false });
      throw err;
    }
  },

  deleteClient: async (id) => {
    set({ isLoadingClients: true, error: null });
    try {
      await clientService.delete(id);
      await get().fetchClients();
    } catch (err) {
      set({ isLoadingClients: false });
      throw err;
    }
  },
}));