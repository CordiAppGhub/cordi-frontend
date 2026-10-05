import { create } from 'zustand';

interface FleetStore {
  isModalOpen: boolean;
  selectedDate: string;
  openModal: () => void;
  closeModal: () => void;
  setSelectedDate: (date: string) => void;
}

export const useFleetStore = create<FleetStore>((set) => ({
  isModalOpen: false,
  selectedDate: new Date().toISOString().split('T')[0], // Hoy por defecto
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
  setSelectedDate: (date) => set({ selectedDate: date }),
}));