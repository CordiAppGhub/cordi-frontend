// src/types/location.types.ts

export interface ClientLocationRelation {
  id: number;
  clientId: number;
  locationId: number;
  name: string;
  isClient: boolean;
  isDepot: boolean;
  razonSocial?: string;
  nit?: string;        
}

export type LocationCategory =
  | 'OWN_YARD'
  | 'EMPTY_YARD'
  | 'PORT'
  | 'CLIENT_SITE';

export interface Locations {
  id: number;
  name: string;
  address?: string | null;
  city?: string | null;
  category: LocationCategory;
  hasClientYard: boolean;
  isPort: boolean;
  isDepot: boolean;
  isOwnYard: boolean;
  isOrigin: boolean;
  isDestination: boolean;
  exigeCita: boolean;
  clients?: ClientLocationRelation[];
}

export interface CreateLocationInput {
  name: string;
  address?: string;
  city?: string;
  hasClientYard: boolean;
  isPort: boolean;
  isDepot: boolean;
  isOwnYard: boolean;
  isOrigin: boolean;
  isDestination: boolean;
  exigeCita: boolean;
  clientsData?: {
    clientId: number;
    isClient: boolean;
    isDepot: boolean;
  }[];
}

export interface UpdateLocationInput {
  name?: string;
  address?: string;
  city?: string;
  hasClientYard?: boolean;
  isPort?: boolean;
  isDepot?: boolean;
  isOwnYard?: boolean;
  isOrigin?: boolean;
  isDestination?: boolean;
  exigeCita?: boolean;
  // En la actualización, mandas el arreglo completo para reemplazar las relaciones, 
  // o lo manejas según la lógica de tu backend
  clientsData?: {
    clientId: number;
    isClient: boolean;
    isDepot: boolean;
  }[];
}