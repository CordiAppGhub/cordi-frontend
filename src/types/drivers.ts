import type { VehicleAffiliation, VehicleStatus } from './vehicles';

export interface Driver {
  id: number;
  name: string | null;
  cedula: string | null;
  telefono: string | null;
  chatId: string | null;
  affiliation: VehicleAffiliation;
  isActive: boolean;
  drivenVehicles?: {
    id: number;
    plate: string;
    brand?: string | null;
    status?: VehicleStatus;
    affiliation?: string | null;
  }[];
  isAssigned?: boolean;
  assignedVehiclePlate?: string | null;
  portalLink: string | null;
  isAvailable: boolean;
  conductorStatus?:
    | 'AVAILABLE'
    | 'BUSY'
    | 'BLOCKED_BY_NOVEDAD'
    | 'BLOCKED_BY_ABSENCE';
  ausenciaActiva?: {
    id: number;
    reason: string;
    endDate: string;
  } | null;
}

export interface DriverAssignedOperation {
  id: number;
  type: string;
  status: string;
  origen?: { name?: string | null } | null;
  destino?: { name?: string | null } | null;
  vehicle?: { plate?: string | null } | null;
}

export interface DriverDetails extends Driver {
  assignedOperations?: DriverAssignedOperation[];
}

export interface PaginatedDrivers {
  data: Driver[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type CreateDriverDto = {
  cedula: string;
  name: string;
  telefono?: string;
  affiliation: VehicleAffiliation;
};

export type UpdateDriverDto = Partial<CreateDriverDto> & { isActive?: boolean };