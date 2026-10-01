import { create } from 'zustand';

interface UIState {
  // Modales
  isAssignModalOpen: boolean;
  isCreateModalOpen: boolean;
  selectedOperationId: number | null;
  openAssignModal: (operationId: number) => void;
  closeAssignModal: () => void;
  openCreateModal: () => void;
  closeCreateModal: () => void;

  // 👇 NUEVO: Loader Global para Axios
  isGlobalLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Estado inicial modales
  isAssignModalOpen: false,
  isCreateModalOpen: false,
  selectedOperationId: null,

  openAssignModal: (id) => set({ isAssignModalOpen: true, selectedOperationId: id }),
  closeAssignModal: () => set({ isAssignModalOpen: false, selectedOperationId: null }),
  
  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),

  // 👇 NUEVO: Acciones del Loader Global
  isGlobalLoading: false,
  startLoading: () => set({ isGlobalLoading: true }),
  stopLoading: () => set({ isGlobalLoading: false }),
}));