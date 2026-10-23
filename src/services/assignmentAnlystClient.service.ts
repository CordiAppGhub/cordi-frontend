// src/services/assignment.service.ts

import {
  AnalystDelegation,
  Assignment,
  CreateAssignmentInput,
  CreateDelegationInput,
  DelegationResources,
} from "@/types/assignmentAnlist";
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


  deleteByClient: async (clientId: number): Promise<void> => {
    await api.delete(`/analyst-assignments/client/${clientId}`);
  },
  
  getMyAssignments: async (): Promise<Assignment[]> => {
    const response = await api.get('/analyst-assignments/me');
    return response.data;
  },

  getDelegationResources: async (clientId: number): Promise<DelegationResources> => {
    const response = await api.get(`/analyst-assignments/client/${clientId}/resources`);
    return response.data;
  },

  getActiveDelegations: async (): Promise<AnalystDelegation[]> => {
    const response = await api.get('/analyst-assignments/delegations');
    return response.data;
  },

  createDelegation: async (data: CreateDelegationInput): Promise<AnalystDelegation[]> => {
    const response = await api.post('/analyst-assignments/delegations', data);
    return response.data;
  },

  revokeDelegation: async (delegationId: number): Promise<void> => {
    await api.delete(`/analyst-assignments/delegations/${delegationId}`);
  },
};