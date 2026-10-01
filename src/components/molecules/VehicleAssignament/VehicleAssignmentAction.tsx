'use client';

import React from 'react';
import { Button } from '@/components/atoms/button/button';
import { VehicleAssignment } from '@/types/fleet-types';

interface Props {
  vehicleId: number;
  currentAssignment?: VehicleAssignment;
  onOpenModal: (vehicleId: number) => void;
  onUnassign: (vehicleId: number, plate: string) => void;
  plate: string;
}

export const VehicleAssignmentAction: React.FC<Props> = ({
  vehicleId,
  currentAssignment,
  onOpenModal,
  onUnassign,
  plate,
}) => {
  if (currentAssignment) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium border border-emerald-200">
          👤 {currentAssignment.driver.name}
        </span>
        <Button
          variant="secondary"
          onClick={() => onOpenModal(vehicleId)}
          style={{ padding: '4px 8px', fontSize: '0.8rem' }}
        >
          Cambiar
        </Button>
        <Button
          variant="secondary"
          onClick={() => unassignVehicleAction(vehicleId, plate, onUnassign)}
          style={{ padding: '4px 8px', fontSize: '0.8rem', color: '#dc2626' }}
        >
          Liberar
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="secondary"
      onClick={() => onOpenModal(vehicleId)}
      style={{ padding: '6px 12px', fontSize: '0.85rem', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #dbeafe' }}
    >
      + Asignar Conductor
    </Button>
  );
};

function unassignVehicleAction(vehicleId: number, plate: string, unassignFn: any) {
  unassignFn(vehicleId, plate);
}