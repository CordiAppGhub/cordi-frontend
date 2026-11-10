'use client';

import React, { useEffect, useState } from 'react';
import { useVehicles } from '@/hooks/use-vehicles';
import { useDrivers } from '@/app/(panel)/fleet/conductores/hooks/use-drivers';
import { Button } from '@/components/atoms/button/button';
import { Select } from '@/components/atoms/select/select';
import { SuperModal } from '../../../../../components/organisms/modal/modal';

interface AssignDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (data: { vehicleId: number; driverId: number; reason: string }) => Promise<boolean>;
  initialVehicleId?: string | number;
}

export default function AssignDriverModal({ 
  isOpen, 
  onClose, 
  onAssign, 
  initialVehicleId 
}: AssignDriverModalProps) {
  const { vehicles, isLoading: loadingVehicles } = useVehicles(isOpen);
  const { drivers, loadDrivers, isLoading: loadingDrivers } = useDrivers();

  const [vehicleId, setVehicleId] = useState(
    initialVehicleId === undefined ? '' : String(initialVehicleId),
  );
  const [driverId, setDriverId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDrivers();
    }
  }, [isOpen, loadDrivers]);

  const vehicleOptions = vehicles.filter(
    (v) =>
      v.ownershipType === 'PROPIO' &&
      (String(v.id) === vehicleId || (v.status === 'AVAILABLE' && !v.driverId)),
  );
  const selectedVehicle = vehicles.find((vehicle) => String(vehicle.id) === vehicleId);
  const driverOptions = drivers.filter((driver) => driver.isActive);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !driverId) return;

    setIsSubmitting(true);
    try {
      const success = await onAssign({
        vehicleId: Number(vehicleId),
        driverId: Number(driverId),
        reason: 'Reasignación desde panel',
      });

      if (success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SuperModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Vincular Vehículo con Conductor"
      width="450px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
            {initialVehicleId === undefined ? 'Seleccionar Vehículo' : 'Vehículo'}
          </label>
          {initialVehicleId !== undefined ? (
            <input
              type="text"
              value={
                selectedVehicle
                  ? `${selectedVehicle.plate}${selectedVehicle.affiliation ? ` - ${selectedVehicle.affiliation}` : ''}`
                  : loadingVehicles
                    ? 'Cargando cabezote...'
                    : `Cabezote #${vehicleId}`
              }
              readOnly
              aria-readonly="true"
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                fontSize: '0.95rem',
                cursor: 'not-allowed',
              }}
            />
          ) : (
            <select
              value={vehicleId}
              onChange={(e) => {
                setVehicleId(e.target.value);
                setDriverId('');
              }}
              disabled={loadingVehicles}
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: '#f9fafb',
                fontSize: '0.95rem',
              }}
              required
            >
              <option value="" disabled>
                {loadingVehicles ? 'Cargando flota...' : '-- Selecciona una placa --'}
              </option>
              {vehicleOptions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate} {v.affiliation ? `- ${v.affiliation}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
            Seleccionar Conductor
          </label>
          <Select
            searchable
            value={driverId}
            onValueChange={setDriverId}
            disabled={loadingDrivers}
            searchPlaceholder={
              loadingDrivers ? 'Cargando conductores...' : 'Buscar conductor...'
            }
            required
            options={driverOptions.map((driver) => {
              const assignedVehicleElsewhere = driver.drivenVehicles?.find(
                (vehicle) => String(vehicle.id) !== vehicleId,
              );
              const assignedVehiclePlate =
                assignedVehicleElsewhere?.plate ?? driver.assignedVehiclePlate;

              return {
                value: driver.id,
                label: `${driver.name} (C.C. ${driver.cedula})${
                  assignedVehiclePlate
                    ? ` (Ocupado: ${assignedVehiclePlate})`
                    : !driver.isAvailable
                      ? ' (No disponible)'
                      : ''
                }`,
                disabled:
                  assignedVehicleElsewhere !== undefined || !driver.isAvailable,
              };
            })}
          />
        </div>

        <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>
          Los conductores vinculados a otra placa aparecen deshabilitados. Libera su asignación
          actual antes de vincularlos a un vehículo diferente.
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: '10px 16px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={!vehicleId || !driverId}
            style={{
              padding: '10px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            Confirmar Vínculo
          </Button>
        </div>
      </form>
    </SuperModal>
  );
}