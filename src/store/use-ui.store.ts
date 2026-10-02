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

  isGlobalLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isAssignModalOpen: false,
  isCreateModalOpen: false,
  selectedOperationId: null,

  openAssignModal: (id) => set({ isAssignModalOpen: true, selectedOperationId: id }),
  closeAssignModal: () => set({ isAssignModalOpen: false, selectedOperationId: null }),
  
  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),

  isGlobalLoading: false,
  startLoading: () => set({ isGlobalLoading: true }),
  stopLoading: () => set({ isGlobalLoading: false }),
}));