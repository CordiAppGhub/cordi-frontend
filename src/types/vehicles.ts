export interface DriverInfo {
  id: number;
  name: string;
  telefono: string;
  cedula: string;
}

export type VehicleAffiliation = 'CORDIVEHICULOS' | 'CORDIHUB' | 'TERCEROS';
export type VehicleStatus = 'AVAILABLE' | 'IN_TRANSIT' | 'MAINTENANCE' | 'OUT_OF_SERVICE';

export interface Vehicle {
  id: number;
  plate: string;
  brand: string | null;
  modelYear: number | null;
  capacityWeight: number | null;
  status: VehicleStatus; 

  affiliation: VehicleAffiliation;
  adminDiscount: number | null;

  soatExpiration: string | null;
  tecnoExpiration: string | null;
  empresa: string | null;
  driverId?: number | null;
  analystId?: number | null;
  driver?: DriverInfo | null;
  analyst?: string | null;
}

export type CreateVehicleDto = Omit<
  Vehicle,
  'id' | 'status' | 'driver' | 'analyst' | 'driverId' | 'analystId'
> & {
  affiliation: VehicleAffiliation;
  status?: VehicleStatus;
};

export type UpdateVehicleDto = Partial<CreateVehicleDto> & {
  status?: VehicleStatus;
  driverId?: number | null;
};