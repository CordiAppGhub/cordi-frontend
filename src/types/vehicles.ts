export interface Vehicle {
  id: number;
  plate: string;
  brand: string | null;
  modelYear: number | null;
  capacityWeight: number | null;
  status: 'AVAILABLE' | 'IN_TRANSIT' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  soatExpiration: string | null;
  tecnoExpiration: string | null;
  empresa: string | null;
}

export type CreateVehicleDto = Omit<Vehicle, 'id' | 'status'>;
export type UpdateVehicleDto = Partial<CreateVehicleDto> & { status?: Vehicle['status'] };