import { api } from "./api.service";

export interface DriverPortalData {
  id: number;
  name: string;
  cedula: string;
  telefono: string;
  portalLink: string;
  drivenVehicles: Array<{
    id: number;
    plate: string;
    brand: string;
    status: string;
    empresa: string;
  }>;
  assignedOperations: Array<{
    id: number;
    createdAt: string;
    origen: { name: string };
    destino: { name: string };
    vehicle: { plate: string };
    status?: string;
  }>;
}

export const driverPortalService = {
  getByToken: async (token: string): Promise<DriverPortalData> => {
    const { data } = await api.get(`/drivers/portal?token=${token}`);
    return data;
  },

  uploadEvidence: async (operationId: number, file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('operationId', String(operationId));

    await api.post(`/operations/${operationId}/evidences`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};