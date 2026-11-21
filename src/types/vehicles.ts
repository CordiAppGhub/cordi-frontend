export interface DriverInfo {
  id: number;
  name: string;
  telefono: string;
  cedula: string;
}

export type VehicleOwnershipType = 'PROPIO' | 'TERCERO';
export type VehicleAffiliation = 'CORDIVEHICULOS' | 'CORDIHUB' | 'TERCEROS';
export type VehicleStatus = 'AVAILABLE' | 'IN_TRANSIT' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
export type VehicleType = 'PATINETA' | 'MULA' | 'C2' | 'C3';
export type FleetAssetType = VehicleType | 'TRAILER';
export const VEHICLE_TYPES = ['PATINETA', 'MULA'] as const satisfies readonly VehicleType[];
export const TRACTOR_AXLE_OPTIONS = [2, 3] as const;
export const TRAILER_AXLE_OPTIONS = [1, 2, 3] as const;
export const CARGO_VEHICLE_TYPE_CODES = [
  'C2',
  '2S1',
  'C3',
  '3S1',
  '2S2',
  '2S3',
  '3S2',
  '3S3',
] as const;
export type CargoVehicleTypeCode =
  (typeof CARGO_VEHICLE_TYPE_CODES)[number];
export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  PATINETA: 'Patineta (2 ejes)',
  MULA: 'Mula (3 ejes)',
  C2: 'C2 · Camión sencillo rígido (2 ejes)',
  C3: 'C3 · Camión dobletroque rígido (3 ejes)',
};
export const FLEET_VEHICLE_TYPES = [
  'PATINETA',
  'MULA',
  'C2',
  'C3',
] as const satisfies readonly VehicleType[];
export const VEHICLE_TYPE_OPTIONS = FLEET_VEHICLE_TYPES.map((value) => ({
  value,
  label: VEHICLE_TYPE_LABELS[value],
}));
export type TrailerStatus =
  | 'COUPLED'
  | 'AVAILABLE_IN_YARD'
  | 'AT_CLIENT_SITE'
  | 'IN_MAINTENANCE';
export const TRAILER_TYPES = [
  'PLANCHA',
  'PLATAFORMA',
  'GRILLO',
  'TANQUE',
  'FURGON',
  'CAMA_BAJA',
  'PORTACONTENEDOR',
] as const;
export const DEFAULT_CONTAINER_TRAILER_TYPE = 'PORTACONTENEDOR' satisfies (typeof TRAILER_TYPES)[number];

export type TrailerType = (typeof TRAILER_TYPES)[number];

export const TRAILER_TYPE_LABELS: Record<TrailerType, string> = {
  PLANCHA: 'Plancha',
  PLATAFORMA: 'Plataforma',
  GRILLO: 'Grillo',
  TANQUE: 'Tanque',
  FURGON: 'Furgón',
  CAMA_BAJA: 'Cama baja',
  PORTACONTENEDOR: 'Portacontenedor',
};

export const TRAILER_TYPE_OPTIONS = TRAILER_TYPES.map((value) => ({
  value,
  label: TRAILER_TYPE_LABELS[value],
}));

export const getFleetConfigurationCode = (
  tractorAxles?: number | null,
  trailerAxles?: number | null,
  vehicleType?: string | null,
): string | null =>
  (tractorAxles === 2 || tractorAxles === 3) &&
  (trailerAxles === 1 || trailerAxles === 2 || trailerAxles === 3) &&
  (vehicleType == null ||
    (vehicleType === 'PATINETA' && tractorAxles === 2) ||
    (vehicleType === 'MULA' && tractorAxles === 3))
    ? `${tractorAxles}S${trailerAxles}`
    : trailerAxles == null &&
        (vehicleType === 'C2' || vehicleType === 'C3') &&
        tractorAxles === (vehicleType === 'C2' ? 2 : 3)
      ? vehicleType
      : null;

export interface Vehicle {
  id: number;
  plate: string;
  type: VehicleType;
  axles: number | null;
  requiresTrailer?: boolean;
  brand: string | null;
  modelYear: number | null;
  cargoCapacity: number | null;
  configurationCode?: string | null;
  effectiveCapacityKg?: number | null;
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
  axles: 1 | 2 | 3;
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
  axles: 1 | 2 | 3;
  currentLocationId: number;
  notes?: string;
  brand?: string;
  capacity?: number;
}

export type UpdateTrailerInput = Partial<CreateTrailerInput>;

export type CreateVehicleDto = Omit<
  Vehicle,
  | 'id'
  | 'axles'
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
  axles?: 2 | 3;
  requiresTrailer?: boolean;
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