export interface Driver {
  id: number;
  name: string | null;
  cedula: string | null;
  telefono: string | null;
  chatId: string | null;
  isActive: boolean;
  // Si en el backend usaste el "include" para ver el vehículo actual:
  drivenVehicles?: { plate: string }[];
  portalLink: string | null;
}

export type CreateDriverDto = {
  cedula: string;
  name?: string;
  telefono?: string;
};

export type UpdateDriverDto = Partial<CreateDriverDto> & { isActive?: boolean };