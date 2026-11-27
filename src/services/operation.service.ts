import { api } from "./api.service";
import { isAxiosError } from "axios";
import {
  Operation,
  OperationSurcharge,
  OperationsClientGroup,
  Evidence,
} from "@/types/operation-types";
import type {
  CargoVehicleTypeCode,
  TrailerType,
} from "@/types/vehicles";
import type { ContainerType } from "@/types/tariff-ypes";
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
  search?: string;
  isContainerized?: boolean;
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
  search?: string;
  isContainerized?: boolean;
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
  conceptCode: string | null;
  concept: {
    code: string;
    name: string;
    applicableTo: string | null;
  } | null;
  durationHours: number | null;
  description: string;
  evidenceUrl: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  driver: { id: number; name: string | null; cedula: string | null };
  operation: {
    id: number;
    containerNumber: string | null;
    numeroPedido: string | null;
    client: { razonSocial: string } | null;
  };
  novedad: {
    metadata: {
      conceptId?: string;
      conceptName?: string;
    } | null;
  } | null;
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
  type:
    | "EXPORTACION"
    | "IMPORTACION"
    | "RETIRO_VACIO"
    | "DEVOLUCION_VACIO";
  status: string;
  isContainerized: boolean;
  numeroPedido?: string | null;
  containerNumber: string | null;
  containerType?: string | null;
  containerStatus?: string;
  isReturnAmparo?: boolean;
  hasAppointment?: boolean;
  appointmentAt: string;
  fechaCitaDestino?: string | null;
  requiredTrailerType?: TrailerType | null;
  cargoDescription?: string;
  cargoVehicleType?: {
    tractorAxles: number | null;
    trailerAxles: number | null;
    requiresTrailer: boolean;
  } | null;
  analyst: { id: number; name: string | null } | null;
  driver: { id: number; name: string | null } | null;
  vehicle: { id: number; plate: string } | null;
  port: { id: number; name: string; isPort: boolean } | null;
}

export interface AmparoSuggestion {
  kind?: "PUERTO" | "PATIO";
  exportOperation: AmparoSuggestionOperation;
  importOperation: AmparoSuggestionOperation;
  hasAssignedDriver: boolean;
  conflictingDrivers: boolean;
}

export interface ConfirmAmparoPayload {
  kind?: "PUERTO" | "PATIO";
  exportOperationId: number;
  importOperationId: number;
  driverId?: number;
  vehicleId: number;
}

export type BulkOperationType =
  | "IMPORTACION"
  | "EXPORTACION"
  | "RETIRO_VACIO"
  | "DEVOLUCION_VACIO"
  | "NACIONAL"
  | "MOVIMIENTO_INTERNO";

export type BulkContainerType = ContainerType;

export interface CreateBulkOperationsPayload {
  clientId: number;
  type: BulkOperationType;
  operationType: BulkOperationType;
  numeroPedido: string;
  fechaLimiteDocumental?: string | null;
  fechaLimiteFisico?: string | null;
  fechaLimiteDevolucion?: string | null;
  scheduledAt?: string | null;
  isContainerized?: boolean;
  shippingLineId?: number;
  routeScope: "URBANO" | "NACIONAL";
  portId?: number;
  clientLocationId?: number;
  yardId?: number;
  requiresInspection?: boolean;
  containers: Array<{
    operationType: BulkOperationType;
    isContainerized: boolean;
    containerNumber?: string | null;
    containerType?: BulkContainerType;
    cargoDescription?: string;
    weight?: number;
    dimensions?: string | null;
    packageType?: string | null;
    packageCount?: number | null;
    volumeM3?: number | null;
    cargoVehicleTypeCode: CargoVehicleTypeCode;
    requiredTrailerType?: TrailerType | null;
    vehicleId: null;
    driverId: null;
    scheduledAt?: string | null;
    portAppointmentAt?: string | null;
    yardAppointmentAt?: string | null;
    fechaCitaOrigen?: string | null;
    fechaCitaDestino?: string | null;
    fechaRetiro?: string | null;
    isAnticipada?: boolean;
    requiresInspection?: boolean;
    origenId?: number;
    cargueId?: number;
    destinoId?: number;
    depositoDevolucionId?: number;
    destinoTemporalId?: number;
  }>;
}

export interface ImportedOperationPreviewRow {
  rowNumber: number;
  status: "VALID" | "NEEDS_CLIENT_FIX" | "ERROR";
  messages: string[];
  errors: string[];
  numeroPedido: string;
  clientId: number | null;
  clientName: string;
  analystId: number | null;
  analystName: string | null;
  type: "EXPORTACION" | "IMPORTACION" | null;
  routeScope: "URBANO" | "NACIONAL" | null;
  isContainerized: boolean | null;
  containerNumber: string | null;
  containerType: ContainerType | null;
  weight: number | null;
  volumeM3: number | null;
  cargoVehicleTypeCode: string | null;
  clientLocationId: number | null;
  locationName: string;
  yardId: number | null;
  yardName: string;
  shippingLineId: number | null;
  shippingLineName: string;
  portId: number | null;
  portName: string | null;
}

export interface ImportedOperationsPreview {
  rows: ImportedOperationPreviewRow[];
  availableClients: Array<{
    id: number;
    name: string;
    analystId: number | null;
    analystName: string | null;
  }>;
  availableClientLocations: Array<{
    id: number;
    clientId: number;
    name: string;
  }>;
  availablePorts: Array<{ id: number; name: string }>;
}

export interface ConfirmImportedOperation {
  clientId: number;
  clientLocationId: number;
  portId: number;
  yardId?: number;
  shippingLineId?: number;
  numeroPedido: string;
  type: "EXPORTACION" | "IMPORTACION";
  routeScope: "URBANO" | "NACIONAL";
  isContainerized: boolean;
  containerNumber?: string | null;
  weight: number;
  volumeM3?: number;
  cargoVehicleTypeCode?: string | null;
}

export interface ImportedOperationsResult {
  createdCount: number;
  createdOperations: Operation[];
}

export interface ShippingLine {
  id: number;
  name: string;
  nit: string;
  createdAt: string;
}

export interface PendingManifestOperation {
  id: number;
  numeroPedido: string | null;
  type: string;
  isContainerized: boolean;
  containerNumber: string | null;
  cargoDescription: string | null;
  clientId: number | null;
  clientName: string;
  analystId: number | null;
  analystName: string | null;
  driver: {
    name: string | null;
    cedula: string | null;
    telefono: string | null;
  } | null;
  vehicle: {
    plate: string;
    trailerPlate: string | null;
  } | null;
  scheduledAt: string | null;
  freightToCharge: number;
  freightToPay: number;
  status: string;
  readyToManifest: boolean;
}

export interface PendingManifestSummary {
  totalCount: number;
  readyToManifestCount: number;
  withoutVehicleCount: number;
  totalFreightToCharge: number;
  readyFreightToCharge: number;
  totalFreightToPay: number;
  readyFreightToPay: number;
}

export interface PendingManifestAnalystSummary {
  analystId: number | null;
  analystName: string;
  totalCount: number;
  readyToManifestCount: number;
  totalFreightToCharge: number;
  totalFreightToPay: number;
}

export interface PendingManifestClientSummary {
  clientId: number | null;
  clientName: string;
  analystId: number | null;
  analystName: string;
  totalCount: number;
  readyToManifestCount: number;
  totalFreightToCharge: number;
  totalFreightToPay: number;
}

export interface PendingManifestResponse {
  summary: PendingManifestSummary;
  byAnalyst: PendingManifestAnalystSummary[];
  byClient: PendingManifestClientSummary[];
  items: PendingManifestOperation[];
}

export interface PendingManifestFilters {
  analystId?: number;
  clientId?: number;
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
  cargoVehicleTypeCode: CargoVehicleTypeCode | null;
  requiredTrailerType: TrailerType | null;
  clientId: number;
  isAnticipada: boolean;
  destinoTemporalId: number | null;
  origenId: number | null;
  cargueId: number | null;
  descargueId: number | null;
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
  sealNumber: string | null;
  documentoTransporte: string;
  numeroPedido: string;
  observaciones: string;
  fechaCitaOrigen: string | null;
  fechaCitaDestino: string | null;
  nuevoDestinoId: number | null;
  fechaCitaDesvio: string | null;
  fechaRetiro: string | null;
  fechaLimiteFisico: string | null;
  diasLibresDocumental: number | null;
  fechaLimiteDocumental: string | null;
  diasLibresDevolucion: number | null;
  fechaLimiteDevolucion: string | null;
  depositoDevolucionId: number | null;
  programarDesvio: boolean;
  shippingLineId: number | null;
  relatedOperationId: number;
  requiresInspection: boolean;
}>;

export interface AssignExternalResourcesPayload {
  plate: string;
  trailerPlate?: string;
  tractorAxles?: 2 | 3;
  trailerType?: TrailerType;
  trailerAxles?: 1 | 2 | 3;
  cargoCapacityKg?: number;
  force?: boolean;
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
  downloadOperationsImportTemplate: async (): Promise<Blob> => {
    const response = await api.get<Blob>(
      "/operations/import-excel/template",
      { responseType: "blob" },
    );
    return response.data;
  },

  previewOperationsExcel: async (
    file: File,
  ): Promise<ImportedOperationsPreview> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<ImportedOperationsPreview>(
      "/operations/import-excel/preview",
      formData,
    );
    return response.data;
  },

  confirmOperationsExcel: async (
    rows: ConfirmImportedOperation[],
  ): Promise<ImportedOperationsResult> => {
    const response = await api.post<ImportedOperationsResult>(
      "/operations/import-excel/confirm",
      { rows },
    );
    return response.data;
  },

  getEvidencePdf: async (operationId: number): Promise<Blob> => {
    const response = await api.get<Blob>(
      `/operations/${operationId}/evidences-pdf`,
      { responseType: "blob" },
    );
    return response.data;
  },
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

  createBulkOperations: async (
    payload: CreateBulkOperationsPayload,
  ): Promise<Operation[]> => {
    try {
      const response = await api.post<Operation[]>("/operations/bulk", payload);
      return response.data;
    } catch (error: unknown) {
      if (
        isAxiosError<{ message?: string | string[] }>(error)
      ) {
        const message = error.response?.data?.message;
        if (Array.isArray(message)) {
          throw new Error(message.join(" "));
        }
        if (typeof message === "string") {
          throw new Error(message);
        }
      }
      throw error;
    }
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

  getPendingManifestOperations: async (
    filters: PendingManifestFilters = {},
  ): Promise<PendingManifestResponse> => {
    const response = await api.get<PendingManifestResponse>(
      "/operations/pending-manifest",
      { params: filters },
    );
    return response.data;
  },

  registerManifest: async (
    operationId: number,
    manifestNumber: string,
    file: File | null,
  ): Promise<{ id: number; documentoTransporte: string }> => {
    const formData = new FormData();
    formData.append("manifestNumber", manifestNumber);
    if (file) formData.append("file", file);
    const response = await api.patch<{
      id: number;
      documentoTransporte: string;
    }>(`/operations/${operationId}/manifest`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
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
      comodato?: File | File[];
    },
  ): Promise<Operation> => {
    const formData = new FormData();
    formData.append("result", data.result);
    if (data.newLocationId !== undefined) {
      formData.append("newLocationId", String(data.newLocationId));
    }
    if (data.observations) formData.append("observations", data.observations);
    const comodatos = data.comodato
      ? Array.isArray(data.comodato)
        ? data.comodato
        : [data.comodato]
      : [];
    comodatos.forEach((file) => formData.append("comodatos", file));
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
    payload: {
      conceptId: string;
      amount: number;
      cost: number;
      isPatioCharge?: boolean;
      patioLocationId?: number;
    },
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
