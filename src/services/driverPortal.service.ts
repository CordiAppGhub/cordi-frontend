import {
  DriverPortalData,
  OperationContainerStatus,
  TripMicroState,
  OcrResult,
} from "@/types/driver-portal.types";
import { api } from "./api.service";
import type { MyNovedadesResponse, NovedadCategory } from "./novedades.servies";

export const driverPortalService = {
  uploadEvidence: async (
    operationId: number,
    file: File,
    evidenceType?: string,
    etapa?: string,
    formato?: string,
  ): Promise<void> => {
    const formData = new FormData();
    formData.append("file", file);
    if (evidenceType) formData.append("type", evidenceType);
    if (etapa) formData.append("etapa", etapa);
    if (formato) formData.append("formato", formato);

    await api.post(`/portal/operations/${operationId}/evidences`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  reportDeviation: async (operationId: number, file: File): Promise<void> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("reason", "AVERIA_NO_APTO");

    await api.post(`/portal/operations/${operationId}/diversion`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  updateTravelState: async (
    operationId: number,
    estadoViaje: TripMicroState | "FINALIZADO",
  ): Promise<void> => {
    await api.patch(`/portal/operations/${operationId}/status`, {
      estadoViaje,
    });
  },

  updateContainerStatus: async (
    operationId: number,
    containerStatus: OperationContainerStatus,
    issueDescription?: string,
  ): Promise<void> => {
    await api.patch(`/portal/operations/${operationId}/container-status`, {
      containerStatus,
      ...(issueDescription ? { issueDescription } : {}),
    });
  },

  scanPlate: async (operationId: number, file: File): Promise<OcrResult> => {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await api.post(
      `/portal/operations/${operationId}/ocr-plate`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return data;
  },

  scanContainer: async (
    operationId: number,
    file: File,
  ): Promise<OcrResult> => {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await api.post(
      `/portal/operations/${operationId}/ocr-container`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return data;
  },
  async getDriverHistory() {
    const response = await api.get("/auth/driver/history");
    return response.data;
  },
  async getMyNovedades(): Promise<MyNovedadesResponse> {
    const { data } = await api.get<MyNovedadesResponse>("/portal/novedades/mine");
    return data;
  },
  async reportNovedad(payload: {
    target: "DRIVER" | "VEHICLE";
    category: NovedadCategory;
    description: string;
    expectedReturnAt?: string;
  }) {
    const { data } = await api.post("/portal/novedades", payload);
    return data;
  },
};

export const driverAuthService = {
  requestOtp: async (cedula: string) => {
    const { data } = await api.post("/auth/driver/request-otp", { cedula });
    return data;
  },

  verifyOtp: async (cedula: string, code: string) => {
    const { data } = await api.post("/auth/driver/verify-otp", {
      cedula,
      code,
    });
    return data;
  },

  getDriverProfile: async (): Promise<DriverPortalData> => {
    const { data } = await api.get<DriverPortalData>("/auth/driver/me");
    return data;
  },
};
