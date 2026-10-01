import { Client } from "./client.-types";

export interface TarifaLocation {
  id: number;
  operacion: string;
  valor?: number;
}

export interface ClientLocation {
  id?: number;
  clientId: number;
  locationId: number;
  client?: Client;
}

export interface Locations {
  id: number;
  name: string;
  address?: string;
  
  isPort: boolean;
  isDepot: boolean;
  isClient: boolean;
  
  isOrigin: boolean;
  isDestination: boolean;
  
  // 🚀 NUEVO: Control dinámico para la UI en operaciones
  exigeCita: boolean;
  
  clients?: ClientLocation[];
  
  createdAt: string;
  updatedAt: string;

  tarifas?: TarifaLocation[];
}

export type CreateLocationInput = Omit<
  Locations, 
  'id' | 'createdAt' | 'updatedAt' | 'clients' | 'tarifas'
> & {
  clientIds?: number[]; // Permitimos enviar el arreglo de IDs de clientes al crear/editar
};

export type UpdateLocationInput = Partial<CreateLocationInput>;