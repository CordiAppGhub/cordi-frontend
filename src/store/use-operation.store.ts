import { create } from 'zustand';

import { Operation } from '@/types/operation-types';

interface OperationState {
  operations: Operation[];
  currentOperation: Operation | null;

  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;

  isLoadingOperations: boolean;
  isLoadingCurrent: boolean;
  error: string | null;

  setOperations: (operations: Operation[]) => void;

  setCurrentOperation: (
    operation: Operation | null
  ) => void;

  setMeta: (
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    } | null
  ) => void;

  setIsLoadingOperations: (loading: boolean) => void;

  setIsLoadingCurrent: (loading: boolean) => void;

  setError: (error: string | null) => void;

  addOperation: (operation: Operation) => void;

  updateOperation: (
    id: number,
    data: Partial<Operation>
  ) => void;

  removeOperation: (id: number) => void;

  clearCurrentOperation: () => void;
}

export const useOperationStore = create<OperationState>((set) => ({
  operations: [],
  currentOperation: null,
  meta: null,

  isLoadingOperations: false,
  isLoadingCurrent: false,

  error: null,

  setOperations: (operations) =>
    set({ operations }),

  setCurrentOperation: (currentOperation) =>
    set({ currentOperation }),

  setMeta: (meta) =>
    set({ meta }),

  setIsLoadingOperations: (isLoadingOperations) =>
    set({ isLoadingOperations }),

  setIsLoadingCurrent: (isLoadingCurrent) =>
    set({ isLoadingCurrent }),

  setError: (error) =>
    set({ error }),

  addOperation: (operation) =>
    set((state) => ({
      operations: [
        ...state.operations,
        operation,
      ],
    })),

  updateOperation: (id, data) =>
    set((state) => ({
      operations: state.operations.map((operation) =>
        operation.id === id
          ? { ...operation, ...data }
          : operation
      ),

      currentOperation:
        state.currentOperation?.id === id
          ? {
            ...state.currentOperation,
            ...data,
          }
          : state.currentOperation,
    })),

  removeOperation: (id) =>
    set((state) => ({
      operations: state.operations.filter(
        (operation) => operation.id !== id
      ),
    })),

  clearCurrentOperation: () =>
    set({
      currentOperation: null,
    }),
}));