import { create } from 'zustand';
import { AmparoSuggestion } from '@/services/operation.service';

interface AmparosState {
  selectedSuggestion: AmparoSuggestion | null;
  driverId: string;
  vehicleId: string;
  agreementConfirmed: boolean;
  
  // Actions
  openConfirmation: (suggestion: AmparoSuggestion) => void;
  closeConfirmation: () => void;
  setDriverId: (id: string) => void;
  setVehicleId: (id: string) => void;
  setAgreementConfirmed: (confirmed: boolean) => void;
}

export const useAmparosStore = create<AmparosState>((set) => ({
  selectedSuggestion: null,
  driverId: '',
  vehicleId: '',
  agreementConfirmed: false,

  openConfirmation: (suggestion) => set({
    selectedSuggestion: suggestion,
    agreementConfirmed: false,
    driverId: String(suggestion.exportOperation.driver?.id ?? suggestion.importOperation.driver?.id ?? ''),
    vehicleId: String(suggestion.exportOperation.vehicle?.id ?? suggestion.importOperation.vehicle?.id ?? '')
  }),

  closeConfirmation: () => set({
    selectedSuggestion: null,
    agreementConfirmed: false,
    driverId: '',
    vehicleId: ''
  }),

  setDriverId: (id) => set({ driverId: id }),
  setVehicleId: (id) => set({ vehicleId: id }),
  setAgreementConfirmed: (confirmed) => set({ agreementConfirmed: confirmed })
}));