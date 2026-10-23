import type { VehicleStatus } from './vehicles';

export interface Driver {
  id: number;
  name: string | null;
  cedula: string | null;
  telefono: string | null;
  chatId: string | null;
  isActive: boolean;
  drivenVehicles?: { plate: string; status?: VehicleStatus }[];
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

export type CreateDriverDto = {
  cedula: string;
  name?: string;
  telefono?: string;
};

export type UpdateDriverDto = Partial<CreateDriverDto> & { isActive?: boolean };