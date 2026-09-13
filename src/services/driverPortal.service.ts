import { DriverPortalData, TripMicroState, OcrResult } from "@/types/driver-portal.types";
import { api } from "./api.service";

export const driverPortalService = {
  getByToken: async (token: string): Promise<DriverPortalData> => {
    const { data } = await api.get(`/drivers/portal?token=${token}`);
    return data;
  },

  uploadEvidence: async (operationId: number, file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('operationId', String(operationId));

    await api.post(`/portal/operations/${operationId}/evidences`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  updateTravelState: async (operationId: number, estadoViaje: TripMicroState | 'FINALIZADO', token: string): Promise<void> => {
    await api.patch(`/portal/operations/${operationId}/status`, {
      estadoViaje,
      token,
    });
  },

  scanPlate: async (operationId: number, file: File, token: string): Promise<OcrResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('token', token);

    const { data } = await api.post(`/portal/operations/${operationId}/ocr-plate`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  scanContainer: async (operationId: number, file: File, token: string): Promise<OcrResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('token', token);

    const { data } = await api.post(`/portal/operations/${operationId}/ocr-container`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};