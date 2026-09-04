export interface VehicleAssignment {
  id: number;
  assignedAt: string;
  unassignedAt: string | null;
  reason: string | null;
  vehicleId: number;
  driverId: number;
  vehicle: {
    id: number;
    plate: string;
    empresa: string | null;
  };
  driver: {
    id: number;
    name: string | null;
    cedula: string | null;
    telefono: string | null;
  };
}

export interface CreateAssignmentDto {
  vehicleId: number;
  driverId: number;
  reason?: string;
}