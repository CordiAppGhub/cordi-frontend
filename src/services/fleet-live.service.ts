import { api } from '@/services/api.service';
import type { TrailerType } from '@/types/vehicles';

export type FleetLiveStatus = 'AVAILABLE' | 'ENDING_SOON' | 'BUSY' | 'UNAVAILABLE';

export interface FleetLiveVehicle {
  id: number;
  plate: string;
  axles: number | null;
  cargoCapacity: number | null;
  ownershipType: 'PROPIO' | 'TERCERO';
  driverId: number | null;
  trailerId: string | null;
  trailer: {
    id: string;
    plate: string;
    trailerType: TrailerType | null;
    axles: number | null;
    capacity: number | null;
  } | null;
  status: FleetLiveStatus;
  appointmentAt: string | null;
}

export interface FleetLiveTrailer {
  id: string;
  plate: string;
  trailerType: TrailerType | null;
  axles: number | null;
  capacity: number | null;
  coupledVehicle: { id: number; plate: string } | null;
  status: FleetLiveStatus;
  appointmentAt: string | null;
}

export interface FleetLiveSnapshot {
  updatedAt: string;
  vehicles: FleetLiveVehicle[];
  trailers: FleetLiveTrailer[];
}

export async function getFleetLiveStatus(): Promise<FleetLiveSnapshot> {
  const response = await api.get<FleetLiveSnapshot>('/fleet/live-status');
  return response.data;
}
