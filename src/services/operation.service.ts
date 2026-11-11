import { api } from "./api.service";
import {
  Operation,
  OperationSurcharge,
  OperationsClientGroup,
  Evidence,
} from "@/types/operation-types";
import type { CargoStatus, OperationContainerStatus } from "@/types/driver-portal.types";

export async function correctContainerState(
  id: number,
  payload: {
    expectedStatus: OperationContainerStatus;
    targetStatus: OperationContainerStatus;
    cargoStatus: CargoStatus;
    reason: string;
  },
): Promise<void> {
  await api.patch(`/operations/${id}/container-state-correction`, payload);
}

// ==========================================
// INTERFACES Y PAYLOADS
// ==========================================
export interface GetOperationsParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  date?: string; // 🚀 Nuevo
  placa?: string; // 🚀 Nuevo
  numeroPedido?: string; // 🚀 Nuevo
  containerNumber?: string; // 🚀 Nuevo
  conductor?: string; // 🚀 Nuevo
  deferOperations?: boolean;
}

export interface PaginatedOperations {
  data: OperationsClientGroup[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginatedClientOperations {
  data: Operation[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}

export interface GetHistoricalOperationsParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  clientId?: number;
  analystId?: number;
  driverId?: number;
  manifiesto?: string;
  containerNumber?: string;
  analista?: string;
  conductor?: string;
}

export interface ScheduleOperationsFilters {
  fechaInicio?: string;
  fechaFin?: string;
  estado?: string;
  busqueda?: string;
  requiereAccion?: boolean;
  analystId?: number;
}

export interface DriverExtraReport {
  id: number;
  operationId: number;
  driverId: number;
  type: "STAND_BY" | "DESVIO" | "MANIOBRA_EXTRA" | "EN_PISO";
  durationHours: number | null;
  description: string;
  evidenceUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  driver: { id: number; name: string | null; cedula: string | null };
  operation: {
    id: number;
    containerNumber: string | null;
    numeroPedido: string | null;
    client: { razonSocial: string } | null;
  };
}

export type HistoricalFilterOptionKind = "manifest";

export interface HistoricalFilterOption {
  value: string;
  label: string;
}

export interface PaginatedHistoricalOperations {
  data: Operation[];
  meta: {
    totalItems: number;
    total: number;
    page: number;
    lastPage: number;
  };
}

export interface AmparoSuggestionOperation {
  id: number;
  type: "EXPORTACION" | "IMPORTACION";
  status: string;
  numeroPedido?: string | null;
  containerNumber: string | null;
  containerType?: string | null;
  containerStatus?: string;
  isReturnAmparo?: boolean;
  hasAppointment?: boolean;
  appointmentAt: string;
  fechaCitaDestino?: string | null;
  analyst: { id: number; name: string | null } | null;
  driver: { id: number; name: string | null } | null;
  vehicle: { id: number; plate: string } | null;
  port: { id: number; name: string; isPort: boolean } | null;
}

export interface AmparoSuggestion {
  exportOperation: AmparoSuggestionOperation;
  importOperation: AmparoSuggestionOperation;
  hasAssignedDriver: boolean;
  conflictingDrivers: boolean;
}

export interface ConfirmAmparoPayload {
  exportOperationId: number;
  importOperationId: number;
  driverId?: number;
  vehicleId: number;
}

export interface ShippingLine {
  id: number;
  name: string;
  nit: string;
  createdAt: string;
}

export type InspectionResult = "APROBADO" | "RECHAZADO_MAL_ESTADO";
export type OperationIssueType = "MECANICA" | "VIA" | "CLIENTE" | "SEGURIDAD";

export interface OperationIssueInput {
  issueType: OperationIssueType;
  description: string;
}

export interface OperationIssue {
  id: number;
  operationId: number;
  issueType: OperationIssueType;
  description: string;
  reportedAt: string;
  reportedBy: { id: number; name: string | null };
}

export type UpdateOperationPayload = Partial<{
  type: string;
  routeScope: "URBANO" | "NACIONAL" | null;
  stops: Array<{
    clientId: number;
    clientLocationId?: number | null;
    locationId: number | null;
    isCustomAddress?: boolean;
    address?: string;
    contactName?: string;
    contactPhone?: string;
    observations?: string;
    stopType: "CARGUE" | "DESCARGUE";
    stopOrder: number;
    cargoDescription?: string;
    weightKg?: number;
  }>;
  isContainerized: boolean;
  vehicleCapacityId: number | null;
  clientId: number;
  isAnticipada: boolean;
  origenId: number | null;
  cargueId: number;
  descargueId: number;
  destinoId: number | null;
  scheduledAt: string;
  driverId: number | null;
  vehicleId: number | null;
  trailerId: string | null;
  fleteACobrar: number | null;
  fleteACobrarManual: number | null;
  agreedFreight: number;
  containerNumber: string | null;
  containerSize: string | null;
  containerType?: string | null;
  peso: number | null;
  cargoDescription: string | null;
  weight: number | null;
  dimensions: string | null;
  packageType: string | null;
  packageCount: number | null;
  volumeM3: number | null;
  sealNumber: string;
  pinRetiro: string;
  documentoTransporte: string;
  numeroPedido: string;
  observaciones: string;
  fechaCitaOrigen: string;
  fechaCitaDestino: string;
  nuevoDestinoId: number;
  fechaCitaDesvio: string;
  fechaRetiro: string;
  depositoDevolucionId: number | null;
  programarDesvio: boolean;
  shippingLineId: number | null;
  relatedOperationId: number;
  requiresInspection: boolean;
}>;

export interface AssignExternalResourcesPayload {
  plate: string;
  driverName: string;
  driverCedula: string;
  driverPhone: string;
  agreedFreight: number;
}

export interface ExternalEvidenceOcrResult {
  kind: "plate" | "trailer" | "container";
  codigo: string | null;
  legible: boolean;
  esperado: string;
  coincide: boolean;
  mensaje: string | null;
}

export interface ExternalEvidenceUploadResponse {
  evidences: Evidence[];
  ocrResults: ExternalEvidenceOcrResult[];
  cierreFisico: boolean;
  motivo?: string;
  operation?: ExternalEvidenceClosedOperation;
}

export type ExternalEvidenceClosedOperation = Pick<
  Operation,
  "id" | "type" | "status" | "isActive" | "isContainerized"
>;

export interface ExternalEvidenceUploads {
  cabezotePhoto: File;
  trailerPhoto: File;
  containerPhoto?: File;
  arinFile?: File;
  comodatoFile?: File;
}

// ==========================================
// SERVICIO PRINCIPAL UNIFICADO
// ==========================================
export const operationService = {
  reportIssue: async (
    operationId: number,
    payload: OperationIssueInput,
  ): Promise<OperationIssue> => {
    const response = await api.post<OperationIssue>(
      `/operations/${operationId}/issues`,
      payload,
    );
    return response.data;
  },

  getShippingLines: async (): Promise<ShippingLine[]> => {
    const response = await api.get<ShippingLine[]>("/shipping-lines");
    return response.data;
  },

  getAmparoSuggestions: async (): Promise<AmparoSuggestion[]> => {
    const response = await api.get<AmparoSuggestion[]>(
      "/operations/amparos/suggestions",
    );
    return response.data;
  },

  confirmAmparo: async (payload: ConfirmAmparoPayload) => {
    const response = await api.post("/operations/amparos/confirm", payload);
    return response.data;
  },

  // ----------------------------------------
  // MÉTODOS PARA PROGRAMACIÓN (useProgramacion)
  // ----------------------------------------

  createOperation: async (
    operationData: Record<string, unknown>,
  ): Promise<Operation> => {
    const response = await api.post<Operation>("/operations", operationData);
    return response.data;
  },

  getOperationsByDate: async (
    filters: ScheduleOperationsFilters,
  ): Promise<Operation[]> => {
    const response = await api.get<Operation[]>("/operations/by-date", {
      params: filters,
    });
    return response.data;
  },

  getPendingCount: async (): Promise<number> => {
    const response = await api.get<{ count: number }>(
      "/operations/pending-count",
    );
    return response.data.count;
  },

  cancelOperation: async (id: number): Promise<void> => {
    await api.patch(`/operations/${id}/cancel`);
  },

  deleteOperation: async (id: number): Promise<{ deletedIds: number[] }> => {
    const response = await api.delete<{ deletedIds: number[] }>(`/operations/${id}`);
    return response.data;
  },

  assignVehicle: async (
    id: number,
    vehicleId: number,
    force?: boolean,
  ): Promise<Operation> => {
    const response = await api.patch<Operation>(
      `/operations/${id}/assign-vehicle`,
      {
        vehicleId,
        ...(force && { force: true }),
      },
    );
    return response.data;
  },

  unassignVehicle: async (id: number): Promise<Operation> => {
    const response = await api.patch<Operation>(
      `/operations/${id}/unassign-fleet`,
    );
    return response.data;
  },

  assignExternalResources: async (
    id: number,
    payload: AssignExternalResourcesPayload,
  ): Promise<Operation> => {
    const response = await api.post<Operation>(
      `/operations/${id}/assign-external`,
      payload,
    );
    return response.data;
  },

  uploadExternalEvidence: async (
    operationId: number,
    uploads: ExternalEvidenceUploads,
  ): Promise<ExternalEvidenceUploadResponse> => {
    const formData = new FormData();
    for (const [field, file] of Object.entries(uploads)) {
      if (file) formData.append(field, file);
    }
    const response = await api.post<ExternalEvidenceUploadResponse>(
      `/operations/${operationId}/external-evidence`,
      formData,
      { timeout: 180_000 },
    );
    return response.data;
  },

  closeExternalEvidence: async (
    operationId: number,
  ): Promise<ExternalEvidenceClosedOperation> => {
    const response = await api.post<ExternalEvidenceClosedOperation>(
      `/operations/${operationId}/external-evidence/close`,
    );
    return response.data;
  },

  // ----------------------------------------
  // MÉTODOS PARA TRÁFICO (useTrafico)
  // ----------------------------------------

  getActiveOperations: async (
    params?: GetOperationsParams,
  ): Promise<PaginatedOperations> => {
    const response = await api.get<PaginatedOperations>("/operations", {
      params,
    });
    return response.data;
  },

  getActiveOperationsByClient: async (
    clientId: number | null,
    params: GetOperationsParams,
  ): Promise<PaginatedClientOperations> => {
    const response = await api.get<PaginatedClientOperations>(
      `/operations/clients/${clientId ?? "unassigned"}/operations`,
      { params },
    );
    return response.data;
  },

  getHistoricalOperations: async (
    params: GetHistoricalOperationsParams,
  ): Promise<PaginatedHistoricalOperations> => {
    const response = await api.get<PaginatedHistoricalOperations>(
      "/operations/history",
      { params },
    );
    return response.data;
  },

  getHistoricalFilterOptions: async (
    kind: HistoricalFilterOptionKind,
    search: string,
  ): Promise<HistoricalFilterOption[]> => {
    const response = await api.get<HistoricalFilterOption[]>(
      `/operations/history/options/${kind}`,
      { params: { search } },
    );
    return response.data;
  },

  getOperationById: async (id: number): Promise<Operation> => {
    const response = await api.get<Operation>(`/operations/${id}`);
    return response.data;
  },

  closeDocumentally: async (operationId: number): Promise<Operation> => {
    const response = await api.patch<Operation>(
      `/operations/${operationId}/cierre-documental`,
    );
    return response.data;
  },

  updateOperation: async (
    operationId: number,
    data: UpdateOperationPayload,
  ): Promise<Operation> => {
    const response = await api.patch<Operation>(
      `/operations/${operationId}`,
      data,
    );
    return response.data;
  },

  recordInspectionResult: async (
    operationId: number,
    data: {
      result: InspectionResult;
      newLocationId?: number;
      observations?: string;
      comodato?: File;
    },
  ): Promise<Operation> => {
    const formData = new FormData();
    formData.append("result", data.result);
    if (data.newLocationId !== undefined) {
      formData.append("newLocationId", String(data.newLocationId));
    }
    if (data.observations) formData.append("observations", data.observations);
    if (data.comodato) formData.append("comodato", data.comodato);
    const response = await api.post<Operation>(
      `/operations/${operationId}/inspection-result`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  setDriverAccess: async (
    operationId: number,
    isActive: boolean,
  ): Promise<Operation> => {
    const response = await api.patch<Operation>(
      `/operations/${operationId}/driver-access`,
      { isActive },
    );
    return response.data;
  },

  reviewEvidence: async (
    evidenceId: number,
    data: { estadoRevision: string; notaAnalista?: string },
  ): Promise<Evidence> => {
    const response = await api.patch<Evidence>(
      `/operations/evidence/${evidenceId}/review`,
      data,
    );
    return response.data;
  },

  updatePatioManual: async (
    operationId: number,
    data: { patioCobro?: number; patioCosto?: number },
  ): Promise<Operation> => {
    const response = await api.patch<Operation>(
      `/operations/${operationId}/patio-manual`,
      data,
    );
    return response.data;
  },

  getPendingExtraReports: async (): Promise<DriverExtraReport[]> => {
    const response = await api.get<DriverExtraReport[]>(
      "/operations/extra-reports/pending",
    );
    return response.data;
  },

  approveExtraReport: async (
    reportId: number,
    payload: { conceptId: string; amount: number; cost: number },
  ): Promise<OperationSurcharge> => {
    const response = await api.post<OperationSurcharge>(
      `/operations/extra-reports/${reportId}/approve`,
      payload,
    );
    return response.data;
  },
};

export const reviewEvidence = operationService.reviewEvidence;
export const updatePatioManual = operationService.updatePatioManual;
export const closeDocumentally = operationService.closeDocumentally;
