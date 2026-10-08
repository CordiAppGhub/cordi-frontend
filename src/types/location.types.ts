// src/types/location.types.ts

export interface ClientLocationRelation {
  clientId: number;
  isClient: boolean;
  isDepot: boolean;
  razonSocial?: string;
  nit?: string;        
}

export interface Locations {
  id: number;
  name: string;
  address?: string | null;
  isPort: boolean;
  isDepot: boolean;
  isOrigin: boolean;
  isDestination: boolean;
  exigeCita: boolean;
  clients?: ClientLocationRelation[];
}

export interface CreateLocationInput {
  name: string;
  address?: string;
  isPort: boolean;
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
  isPort?: boolean;
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