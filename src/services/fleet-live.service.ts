import { api } from '@/services/api.service';

export type FleetLiveStatus = 'AVAILABLE' | 'ENDING_SOON' | 'BUSY' | 'UNAVAILABLE';

export interface FleetLiveVehicle {
  id: number;
  plate: string;
  ownershipType: 'PROPIO' | 'TERCERO';
  driverId: number | null;
  trailerId: string | null;
  status: FleetLiveStatus;
  appointmentAt: string | null;
}

export interface FleetLiveTrailer {
  id: string;
  plate: string;
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
