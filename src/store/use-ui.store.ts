import { create } from 'zustand';

interface UIState {
  isAssignModalOpen: boolean;
  isCreateModalOpen: boolean;
  selectedOperationId: number | null;
  openAssignModal: (operationId: number) => void;
  closeAssignModal: () => void;
  openCreateModal: () => void;
  closeCreateModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isAssignModalOpen: false,
  isCreateModalOpen: false,
  selectedOperationId: null,

  openAssignModal: (id) => set({ isAssignModalOpen: true, selectedOperationId: id }),
  closeAssignModal: () => set({ isAssignModalOpen: false, selectedOperationId: null }),
  
  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),
}));