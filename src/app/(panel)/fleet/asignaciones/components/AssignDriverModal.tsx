'use client';

import React, { useEffect, useState } from 'react';
import { useVehicles } from '@/hooks/use-vehicles';
import { useDrivers } from '@/app/(panel)/fleet/conductores/hooks/use-drivers';
import { Button } from '@/components/atoms/button/button';
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
    (v) => String(v.id) === vehicleId || (v.status === 'AVAILABLE' && !v.driverId),
  );
  const driverOptions = drivers.filter(
    (d) =>
      d.isActive &&
      d.conductorStatus !== 'BLOCKED_BY_NOVEDAD' &&
      (d.drivenVehicles ?? []).every((v) => v.status === 'MAINTENANCE' || v.status === 'OUT_OF_SERVICE'),
  );

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
            Seleccionar Vehículo
          </label>
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
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
                {v.plate} {v.empresa ? `- ${v.empresa}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
            Seleccionar Conductor
          </label>
          <select
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            disabled={loadingDrivers}
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
              {loadingDrivers ? 'Cargando personal...' : '-- Selecciona un conductor --'}
            </option>
            {driverOptions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} (C.C. {d.cedula})
              </option>
            ))}
          </select>
        </div>

        <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>
          Solo se listan vehículos disponibles sin conductor y conductores disponibles sin vehículo
          (o cuyo vehículo está en mantenimiento).
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