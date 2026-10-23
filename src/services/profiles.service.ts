import { api } from "./api.service";

export type ProfileKind =
  | "containers"
  | "vehicles"
  | "drivers"
  | "analysts"
  | "shipping-lines";

export interface ProfileSummary {
  id: number | string;
  name?: string | null;
  plate?: string;
  type?: string | null;
  status?: string;
  isActive?: boolean;
  totalOperations: number;
  activeOperations?: number;
  lastActivity?: string | null;
  nit?: string;
  [key: string]: unknown;
}

export interface ProfileList {
  data: ProfileSummary[];
  meta: { total: number; page: number; limit: number };
}

export interface ProfileOperation {
  id: number;
  type: string;
  status: string;
  containerNumber?: string | null;
  numeroPedido?: string | null;
  documentoTransporte?: string | null;
  scheduledAt?: string | null;
  createdAt: string;
  client?: { razonSocial: string } | null;
  driver?: { name: string | null } | null;
  analyst?: { name: string | null } | null;
  vehicle?: { plate: string } | null;
  trailer?: { plate: string } | null;
  origen?: { name: string } | null;
  destino?: { name: string } | null;
  nuevoDestino?: { name: string } | null;
  shippingLine?: { id: number; name: string; nit: string } | null;
  requiresInspection: boolean;
  inspectionStatus?: "APROBADO" | "RECHAZADO_MAL_ESTADO" | null;
  deviations: Array<{
    id: number;
    reason: string;
    comodatoUrl: string;
    observations?: string | null;
    createdAt: string;
    newLocation: { id: number; name: string };
  }>;
  evidences: Array<{
    id: number;
    type: string;
    url?: string | null;
    createdAt: string;
  }>;
  events: Array<{
    id: number;
    eventType: string;
    description: string;
    createdAt: string;
  }>;
  historialNovedades: Array<{
    id: number;
    description: string;
    severity: string;
    status: string;
    createdAt: string;
    resolutionNotes?: string | null;
  }>;
}

export interface ProfileDetail {
  profile: Record<string, unknown>;
  metrics: {
    totalOperations: number;
    activeOperations: number;
    completedOperations: number;
    incidents: number;
    evidences: number;
    inspections: number;
    rejectedInspections: number;
    deviations: number;
    operationsByStatus: Array<{ status: string; count: number }>;
    operationsByDestination: Array<{
      locationId: number;
      locationName: string;
      count: number;
    }>;
  };
  operations: ProfileOperation[];
  meta: { total: number; page: number; limit: number; lastPage: number };
}

export const profilesService = {
  list: async (
    kind: ProfileKind,
    search: string,
    page = 1,
    limit = 50,
  ): Promise<ProfileList> => {
    const { data } = await api.get<ProfileList>(`/profiles/${kind}`, {
      params: { search: search || undefined, page, limit },
    });
    return data;
  },

  get: async (
    kind: ProfileKind,
    id: number | string,
    page = 1,
    limit = 20,
  ): Promise<ProfileDetail> => {
    const { data } = await api.get<ProfileDetail>(
      `/profiles/${kind}/${encodeURIComponent(String(id))}`,
      { params: { page, limit } },
    );
    return data;
  },
};
