import { api } from '@/services/api.service';

export type AbsenceReason =
  | 'ENFERMEDAD'
  | 'PERMISO'
  | 'INJUSTIFICADO'
  | 'VACACIONES';

export type ResourceRole = 'ANALISTA' | 'CONDUCTOR';

export interface AbsenceClient {
  id: number;
  razonSocial: string;
}

export interface AbsenceAnalyst {
  id: number;
  name: string | null;
  email: string | null;
}

export interface AvailableSubstituteDriver {
  id: number;
  name: string | null;
  cedula: string | null;
}

export interface AbsenceVehicle {
  id: number;
  plate: string;
}

export interface ResourceAbsence {
  id: number;
  userId: number;
  reason: AbsenceReason;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  vehicleId: number | null;
  user: {
    id: number;
    name: string | null;
    role: ResourceRole;
    email?: string | null;
  };
  vehicle: AbsenceVehicle | null;
  analystDelegations: Array<{
    id: number;
    client: { id: number; razonSocial: string };
    delegateAnalyst: { id: number; name: string | null };
  }>;
  driverDelegation: {
    id: number;
    revokedAt: string | null;
    substituteDriver: { id: number; name: string | null };
  } | null;
}

export interface AnalystDelegationResult {
  id: number;
  client: AbsenceClient;
  delegateAnalyst: { id: number; name: string | null };
}

export interface DriverAbsenceDelegationResult {
  id: number;
  vehicle: AbsenceVehicle;
  substituteDriver: { id: number; name: string | null };
  startsAt: string;
  endsAt: string | null;
}

export interface CreateResourceAbsence {
  userId: number;
  reason: AbsenceReason;
  startDate: string;
  endDate: string;
}

export const resourceAbsenceService = {
  getAbsences: async (): Promise<ResourceAbsence[]> => {
    const { data } = await api.get<ResourceAbsence[]>('/resources/absences');
    return data;
  },

  createAbsence: async (
    payload: CreateResourceAbsence,
  ): Promise<ResourceAbsence> => {
    const { data } = await api.post<ResourceAbsence>(
      '/resources/absences',
      payload,
    );
    return data;
  },

  closeAbsence: async (id: number): Promise<ResourceAbsence> => {
    const { data } = await api.patch<ResourceAbsence>(
      `/resources/absences/${id}/close`,
    );
    return data;
  },

  getAnalystClients: async (analystId: number): Promise<AbsenceClient[]> => {
    const { data } = await api.get<AbsenceClient[]>(
      `/resources/analysts/${analystId}/clients`,
    );
    return data;
  },

  getAnalysts: async (excludeId: number): Promise<AbsenceAnalyst[]> => {
    const { data } = await api.get<AbsenceAnalyst[]>('/resources/analysts', {
      params: { excludeId },
    });
    return data;
  },

  getAbsentDriverVehicle: async (
    driverId: number,
  ): Promise<AbsenceVehicle | null> => {
    const { data } = await api.get<AbsenceVehicle | null>(
      `/resources/drivers/${driverId}/vehicle`,
    );
    return data;
  },

  getAvailableDrivers: async (
    excludeId: number,
  ): Promise<AvailableSubstituteDriver[]> => {
    const { data } = await api.get<AvailableSubstituteDriver[]>(
      '/resources/drivers/available',
      { params: { excludeId } },
    );
    return data;
  },

  delegateAnalyst: async (payload: {
    absentAnalystId: number;
    clientIds: number[];
    targetAnalystId: number;
  }): Promise<AnalystDelegationResult[]> => {
    const { data } = await api.post<AnalystDelegationResult[]>(
      '/resources/delegate-analyst',
      payload,
    );
    return data;
  },

  delegateDriver: async (payload: {
    absentDriverId: number;
    vehicleId: number;
    substituteDriverId: number;
  }): Promise<DriverAbsenceDelegationResult> => {
    const { data } = await api.post<DriverAbsenceDelegationResult>(
      '/resources/delegate-driver',
      payload,
    );
    return data;
  },
};
