import {
  DriverPortalData,
  OperationContainerStatus,
  CargoStatus,
  TripMicroState,
  OcrResult,
  FleetPlateVerificationResult,
  TrailerDestinationType,
} from "@/types/driver-portal.types";
import { api } from "./api.service";
import type { MyNovedadesResponse, NovedadCategory } from "./novedades.servies";

interface DriverOtpRequestResponse {
  message: string;
  smsSent: boolean;
  developmentOtp?: string;
}

export type ContainerRollbackReason =
  | "FOTO_BORROSA"
  | "CONTENEDOR_INCORRECTO"
  | "MARQUE_SIN_QUERER"
  | "OTRO";

export interface ContainerRollbackCandidate {
  historyId: number;
  previousState: TripMicroState | null;
  evidenceId: number;
}

export interface ContainerStateRollbackCandidate {
  historyId: number;
  previousStatus: OperationContainerStatus;
}

export const driverPortalService = {
  getContainerStateRollback: async (operationId: number): Promise<ContainerStateRollbackCandidate | null> => {
    const { data } = await api.get<ContainerStateRollbackCandidate | null>(
      `/portal/operations/${operationId}/container-state-rollback`,
    );
    return data;
  },

  rollbackContainerState: async (operationId: number, historyId: number, reason: ContainerRollbackReason): Promise<void> => {
    await api.post(`/portal/operations/${operationId}/container-state-rollback`, { historyId, reason });
  },

  getContainerRollbackCandidate: async (operationId: number): Promise<ContainerRollbackCandidate | null> => {
    const { data } = await api.get<ContainerRollbackCandidate | null>(
      `/portal/operations/${operationId}/container-rollback`,
    );
    return data;
  },

  rollbackContainer: async (operationId: number, historyId: number, reason: ContainerRollbackReason): Promise<void> => {
    await api.post(`/portal/operations/${operationId}/container-rollback`, { historyId, reason });
  },

  reportTrailerLocation: async (
    operationId: number,
    payload: {
      destinationType: TrailerDestinationType;
      clientId?: number;
      ownYardId?: number;
      lat?: number;
      lng?: number;
    },
  ): Promise<void> => {
    await api.patch(
      `/portal/operations/${operationId}/trailer-location`,
      payload,
    );
  },

  verifyFleetPlates: async (
    operationId: number,
    cabImage: File,
    trailerImage: File,
  ): Promise<FleetPlateVerificationResult> => {
    const formData = new FormData();
    formData.append("cabImage", cabImage);
    formData.append("trailerImage", trailerImage);

    const { data } = await api.post<FleetPlateVerificationResult>(
      `/portal/operations/${operationId}/verify-plates-ocr`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      },
    );
    return data;
  },

  uploadEvidence: async (
    operationId: number,
    file: File | File[],
    evidenceType?: string,
    etapa?: string,
    formato?: string,
  ): Promise<void> => {
    const formData = new FormData();
    const files = Array.isArray(file) ? file : [file];
    for (const item of files) {
      formData.append(files.length === 1 ? "file" : "files", item);
    }
    if (evidenceType) formData.append("type", evidenceType);
    if (etapa) formData.append("etapa", etapa);
    if (formato) formData.append("formato", formato);

    await api.post(`/portal/operations/${operationId}/evidences`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 45000,
    });
  },

  reportDeviation: async (operationId: number, file: File): Promise<void> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("reason", "AVERIA_NO_APTO");

    await api.post(`/portal/operations/${operationId}/diversion`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 45000,
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

  updateCargoStatus: async (
    operationId: number,
    cargoStatus: CargoStatus,
  ): Promise<void> => {
    await api.patch(`/portal/operations/${operationId}/cargo-status`, {
      cargoStatus,
    });
  },

  completeStop: async (operationId: number, stopId: number): Promise<void> => {
    await api.patch(
      `/portal/operations/${operationId}/stops/${stopId}`,
      { status: "COMPLETADA" },
    );
  },

  updateSealNumber: async (
    operationId: number,
    sealNumber: string,
  ): Promise<void> => {
    await api.patch(`/portal/operations/${operationId}/seal`, {
      sealNumber,
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
        timeout: 45000,
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
        timeout: 45000,
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
    operationId?: number;
    vehicleId?: number;
    componentIds?: number[];
  }) {
    const { data } = await api.post("/portal/novedades", payload);
    return data;
  },
};

export const driverAuthService = {
  issueManualRecoveryCode: async (
    cedula: string,
  ): Promise<{ code: string; expiresAt: string }> => {
    const { data } = await api.post<{ code: string; expiresAt: string }>(
      "/auth/driver/manual-recovery-code",
      { cedula },
    );
    return data;
  },

  requestOtp: async (cedula: string): Promise<DriverOtpRequestResponse> => {
    const { data } = await api.post<DriverOtpRequestResponse>(
      "/auth/driver/request-otp",
      { cedula },
    );
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
