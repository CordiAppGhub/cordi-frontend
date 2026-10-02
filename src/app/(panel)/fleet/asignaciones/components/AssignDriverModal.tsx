'use client';

import React, { useEffect, useState } from 'react';
import { useVehicles } from '@/hooks/use-vehicles';
import { useDrivers } from '@/app/(panel)/fleet/conductores/hooks/use-drivers';
import { Loader2 } from 'lucide-react';
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
  const { vehicles, loadVehicles, isLoading: loadingVehicles } = useVehicles();
  const { drivers, loadDrivers, isLoading: loadingDrivers } = useDrivers();

  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadVehicles();
      loadDrivers();
    }
  }, [isOpen, loadVehicles, loadDrivers, initialVehicleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !driverId) return;

    setIsSubmitting(true);
    const success = await onAssign({
      vehicleId: Number(vehicleId),
      driverId: Number(driverId),
      reason: 'Reasignación desde panel',
    });
    setIsSubmitting(false);

    if (success) {
      onClose();
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
            {vehicles.map((v) => (
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
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} (C.C. {d.cedula})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
          <button
            type="button"
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
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !vehicleId || !driverId}
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
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Guardando...
              </>
            ) : (
              'Confirmar Vínculo'
            )}
          </button>
        </div>
      </form>
    </SuperModal>
  );
}