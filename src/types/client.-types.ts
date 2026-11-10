import { Locations } from "./location.types";

export interface ClientLocationRelation {
  id: number;
  clientId: number;
  locationId: number;
  location: Locations;
  name: string;
  isClient: boolean;
  isDepot: boolean;
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
  locations: ClientLocationRelation[]; 
}

export type CreateClientInput = Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'locations'>;
export type UpdateClientInput = Partial<CreateClientInput>;