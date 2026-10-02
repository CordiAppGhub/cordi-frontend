import { TripMicroState, OcrResult } from "@/types/driver-portal.types";
import { api } from "./api.service";

export const driverPortalService = {

  uploadEvidence: async (operationId: number, file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);

    await api.post(`/portal/operations/${operationId}/evidences`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  updateTravelState: async (operationId: number, estadoViaje: TripMicroState | 'FINALIZADO'): Promise<void> => {
    await api.patch(`/portal/operations/${operationId}/status`, {
      estadoViaje,
    });
  },

  scanPlate: async (operationId: number, file: File): Promise<OcrResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post(`/portal/operations/${operationId}/ocr-plate`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  scanContainer: async (operationId: number, file: File): Promise<OcrResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post(`/portal/operations/${operationId}/ocr-container`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
   async getDriverHistory() {
    const response = await api.get('/auth/driver/history');
    return response.data;
  },
};

export const driverAuthService = {
  requestOtp: async (cedula: string) => {
    const { data } = await api.post('/auth/driver/request-otp', { cedula });
    return data;
  },

  verifyOtp: async (cedula: string, code: string) => {
    const { data } = await api.post('/auth/driver/verify-otp', { cedula, code });
    return data;
  },
  
  getDriverProfile: async () => {
    const { data } = await api.get('/auth/driver/me'); 
    return data;
  },
 

};