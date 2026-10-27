export interface DriverInfo {
  id: number;
  name: string;
  telefono: string;
  cedula: string;
}

export type VehicleAffiliation = 'CORDIVEHICULOS' | 'CORDIHUB' | 'TERCEROS';
export type VehicleStatus = 'AVAILABLE' | 'IN_TRANSIT' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
export type VehicleType =
  | 'CABEZOTE'
  | 'REMOLQUE'
  | 'CAMION_SENCILLO'
  | 'TRACTOMULA'
  | 'TURBO'
  | 'PLANCHA';

export interface CreateVehicleFormInput {
  plate: string;
  type: VehicleType;
  brand: string;
  modelYear: number;
  empresa: string;
  cargoCapacity: number;
  status: VehicleStatus;
  affiliation: VehicleAffiliation;
  adminDiscount?: number;
  insuranceFileUrl?: string;
  insuranceExpiration?: string;
  tecnomecanicaFileUrl?: string;
  tecnomecanicaExpiration?: string;
}

export interface Vehicle {
  id: number;
  plate: string;
  type: VehicleType;
  brand: string | null;
  modelYear: number | null;
  cargoCapacity: number | null;
  status: VehicleStatus; 

  affiliation: VehicleAffiliation;
  adminDiscount: number | null;

  soatExpiration: string | null;
  tecnoExpiration: string | null;
  insuranceFileUrl: string | null;
  insuranceExpiration: string | null;
  tecnomecanicaFileUrl: string | null;
  tecnomecanicaExpiration: string | null;
  empresa: string | null;
  driverId?: number | null;
  analystId?: number | null;
  driver?: DriverInfo | null;
  analyst?: string | null;
}

export type CreateVehicleDto = Omit<
  Vehicle,
  | 'id'
  | 'status'
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