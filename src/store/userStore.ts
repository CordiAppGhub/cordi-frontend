// src/store/user.store.ts
import { User } from '@/types/user-types';
import { create } from 'zustand';

interface UserStore {
  isModalOpen: boolean;
  mode: 'CREATE' | 'EDIT';
  selectedUser: User | null;
  currentPage: number;
  openModal: (mode: 'CREATE' | 'EDIT', user?: User) => void;
  closeModal: () => void;
  setPage: (page: number) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  isModalOpen: false,
  mode: 'CREATE',
  selectedUser: null,
  currentPage: 1,
  openModal: (mode, user ) => set({ isModalOpen: true, mode, selectedUser: user }),
  closeModal: () => set({ isModalOpen: false, selectedUser: null }),
  setPage: (page) => set({ currentPage: page }),
}));