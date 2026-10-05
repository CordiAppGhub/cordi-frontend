// src/types/location.types.ts

export interface ClientLocationRelation {
  clientId: number;
  isClient: boolean;
  isDepot: boolean;
  client?: {
    id: number;
    razonSocial: string;
    nit: string;
  };
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

// 🚀 Tipo actualizado para la creación/edición que coincide con el nuevo payload masivo
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