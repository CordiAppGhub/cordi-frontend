export interface DriverInfo {
  id: number;
  name: string;
  telefono: string;
  cedula: string;
}

export type VehicleOwnershipType = 'PROPIO' | 'TERCERO';
export type VehicleAffiliation = 'CORDIVEHICULOS' | 'CORDIHUB' | 'TERCEROS';
export type VehicleStatus = 'AVAILABLE' | 'IN_TRANSIT' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
export type VehicleType = 'PATINETA' | 'MULA';
export type FleetAssetType = VehicleType | 'TRAILER';
export type TrailerStatus =
  | 'COUPLED'
  | 'AVAILABLE_IN_YARD'
  | 'AT_CLIENT_SITE'
  | 'IN_MAINTENANCE';
export type TrailerType = 'PLANCHA' | 'GRILLO' | 'TANQUE';

export interface Vehicle {
  id: number;
  plate: string;
  type: VehicleType;
  brand: string | null;
  modelYear: number | null;
  cargoCapacity: number | null;
  status: VehicleStatus; 

  affiliation: VehicleAffiliation;
  ownershipType: VehicleOwnershipType;

  soatExpiration: string | null;
  tecnoExpiration: string | null;
  insuranceFileUrl: string | null;
  insuranceExpiration: string | null;
  tecnomecanicaFileUrl: string | null;
  tecnomecanicaExpiration: string | null;
  driverId?: number | null;
  analystId?: number | null;
  driver?: DriverInfo | null;
  analyst?: string | null;
  currentTrailerId?: string | null;
  currentTrailer?: Trailer | null;
}

export interface Trailer {
  id: string;
  plate: string;
  trailerType: TrailerType;
  axles: 2 | 3;
  brand: string | null;
  capacity: number | null;
  status: TrailerStatus;
  currentLocationId: number;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  currentLocation: { id: number; name: string; address?: string | null };
  coupledVehicle?: { id: number; plate: string; type: VehicleType } | null;
}

export interface CreateTrailerInput {
  plate: string;
  trailerType: TrailerType;
  axles: 2 | 3;
  currentLocationId: number;
  notes?: string;
  brand?: string;
  capacity?: number;
}

export type UpdateTrailerInput = Partial<CreateTrailerInput>;

export type CreateVehicleDto = Omit<
  Vehicle,
  | 'id'
  | 'status'
  | 'ownershipType'
  | 'driver'
  | 'analyst'
  | 'driverId'
  | 'analystId'
  | 'soatExpiration'
  | 'tecnoExpiration'
  | 'insuranceFileUrl'
  | 'insuranceExpiration'
  | 'tecnomecanicaFileUrl'
  | 'tecnomecanicaExpiration'
> & {
  affiliation: VehicleAffiliation;
  status?: VehicleStatus;
  insuranceFileUrl?: string | null;
  insuranceExpiration?: string | null;
  tecnomecanicaFileUrl?: string | null;
  tecnomecanicaExpiration?: string | null;
};

export type UpdateVehicleDto = Partial<CreateVehicleDto> & {
  status?: VehicleStatus;
  driverId?: number | null;
};