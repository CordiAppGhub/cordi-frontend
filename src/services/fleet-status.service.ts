import { api } from "@/services/api.service";
import type { VehicleType } from "@/types/vehicles";

export type FleetLocationCategory =
  | "PUERTO"
  | "PATIO"
  | "CLIENTE"
  | "EN_RUTA"
  | "DISPONIBLE";

export interface FleetStatusItem {
  vehicle: {
    id: number;
    plate: string;
    type: VehicleType;
    brand: string | null;
    status: string;
  };
  trailer: string | null;
  driver: {
    id: number;
    name: string | null;
    document: string | null;
    phone: string | null;
  } | null;
  activeOperation: {
    id: number;
    code: string;
    booking: string | null;
    containerNumber: string | null;
    isContainerized: boolean;
    clientName: string | null;
    analystName: string | null;
    status: string;
  } | null;
  currentLocation: {
    category: FleetLocationCategory;
    placeName: string;
    stepLabel: string;
    updatedAt: string;
  };
}

export async function getFleetStatus(): Promise<FleetStatusItem[]> {
  const response = await api.get<FleetStatusItem[]>("/vehicles/fleet-status");
  return response.data;
}
