// src/services/assignment.service.ts

import { Assignment, CreateAssignmentInput } from "@/types/assignmentAnlist";
import { api } from "./api.service";

export const assignmentService = {
  getAll: async (): Promise<Assignment[]> => {
    const response = await api.get('/analyst-assignments');
    return response.data;
  },

  create: async (data: CreateAssignmentInput): Promise<Assignment> => {
    const response = await api.post('/analyst-assignments', data);
    return response.data;
  },


  delete: async (id: number): Promise<void> => {
    await api.delete(`/analyst-assignments/${id}`);
  },
  
  getMyAssignments: async (): Promise<Assignment[]> => {
    const response = await api.get('/analyst-assignments/me');
    return response.data;
  }
};