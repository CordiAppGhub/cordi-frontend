export interface Location {
  id: number;
  name: string;
  address?: string;
  isPort: boolean;
  isDepot: boolean;
  isClient: boolean;
  isOrigin: boolean;
  isDestination: boolean;
  analystId: number;
  createdAt: string;
  updatedAt: string;
  analyst?: {
    name: string;
  };
  tarifas?: Tarifa[]
}

export interface Tarifa {
  id?: number;
  operacion: string;
  valor: number;
}

export type CreateLocationInput = Omit<Location, 'id' | 'createdAt' | 'updatedAt' | 'analyst'>;
export type UpdateLocationInput = Partial<CreateLocationInput>;