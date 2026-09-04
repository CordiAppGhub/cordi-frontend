import { VehicleAssignment } from '@/types/fleet-types';
import { create } from 'zustand';

interface AssignmentsState {
  activeAssignments: VehicleAssignment[];
  isLoading: boolean;
  setActiveAssignments: (assignments: VehicleAssignment[]) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useAssignmentsStore = create<AssignmentsState>((set) => ({
  activeAssignments: [],
  isLoading: false,
  setActiveAssignments: (activeAssignments) => set({ activeAssignments }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));