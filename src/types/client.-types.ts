import { Locations } from "./location.types";

// 🚀 NUEVO: Representa la relación de la tabla intermedia en el frontend
export interface ClientLocationRelation {
  clientId: number;
  locationId: number;
  location: Locations;
}

export interface Client {
  id: number;
  nit: string;
  razonSocial: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // 🚀 ACTUALIZADO: Apunta a la relación intermedia
  locations: ClientLocationRelation[]; 
}

export type CreateClientInput = Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'locations'>;
export type UpdateClientInput = Partial<CreateClientInput>;