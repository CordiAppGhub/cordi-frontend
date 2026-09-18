export interface Driver {
  id: number;
  name: string | null;
  cedula: string | null;
  telefono: string | null;
  chatId: string | null;
  isActive: boolean;
  drivenVehicles?: { plate: string }[];
  portalLink: string | null;
  isAvailable: boolean;
}

export type CreateDriverDto = {
  cedula: string;
  name?: string;
  telefono?: string;
};

export type UpdateDriverDto = Partial<CreateDriverDto> & { isActive?: boolean };