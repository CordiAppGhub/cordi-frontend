import { api } from "./api.service";
import { VehicleAssignment, CreateAssignmentDto } from "@/types/fleet-types";

export const assignmentsService = {
  getActive: async (): Promise<VehicleAssignment[]> => {
    const { data } = await api.get('/assignments/active');
    return data;
  },

  getHistory: async (): Promise<VehicleAssignment[]> => {
    const { data } = await api.get('/assignments/history');
    return data;
  },

  assign: async (payload: CreateAssignmentDto): Promise<VehicleAssignment> => {
    const { data } = await api.post('/assignments', payload);
    return data;
  },

  unassign: async (vehicleId: number, reason: string = 'Liberación manual'): Promise<void> => {
    await api.put(`/assignments/unassign/${vehicleId}`, { reason });
  }
};