import React, { useState, useEffect } from 'react';
import { Button } from '../../../../../components/atoms/button/button';
import { Select } from '@/components/atoms/select/select';
import { useUIStore } from '@/store/use-ui.store';
import { useOperations } from '@/app/(panel)/operations/hooks/useOperations';
import { useDrivers } from '@/app/(panel)/fleet/conductores/hooks/use-drivers';
import { useVehicles } from '@/hooks/use-vehicles';

import styles from './assign-modal.module.css';

export const AssignModal: React.FC = () => {
  const { isAssignModalOpen, closeAssignModal, selectedOperationId } = useUIStore();
  
  const { operations, assignDriver, reassignDriverAndVehicle } = useOperations();
  const { drivers, loadDrivers } = useDrivers();
  const { vehicles, loadVehicles } = useVehicles();

  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [fletePagoManual, setFletePagoManual] = useState<string>(''); 
  const [error, setError] = useState<string>('');

  const operationTarget = operations.find(op => op.id === selectedOperationId);
  const isEmergencyReassign = operationTarget?.status === 'PAUSADA' || operationTarget?.status === 'EN_CURSO';

  const handleDriverChange = (driverIdStr: string) => {
    setSelectedDriver(driverIdStr);
    setError('');

    const driverIdNum = Number(driverIdStr);
    const vehicleAssigned = vehicles.find(v => v.driverId === driverIdNum);

    if (vehicleAssigned) {
      setSelectedVehicle(String(vehicleAssigned.id));
    } else {
      setSelectedVehicle('');
    }
  };

  // Verificamos si el vehículo seleccionado es externo para pedir el flete manual
  const selectedVehicleObj = vehicles.find(v => v.id === Number(selectedVehicle));
  const isExternal = selectedVehicleObj?.affiliation === 'TERCEROS';

  useEffect(() => {
    if (isAssignModalOpen) {
      loadDrivers();
      loadVehicles();
    }
  }, [isAssignModalOpen, loadDrivers, loadVehicles]);

  const handleClose = () => {
    closeAssignModal();
    setSelectedDriver(''); 
    setSelectedVehicle('');
    setFletePagoManual('');
    setError('');
  };

  if (!isAssignModalOpen) return null;

  const handleSubmit = async () => {
    if (!selectedDriver) {
      setError('Debes seleccionar un conductor');
      return;
    }
    
    if (!selectedVehicle) {
      setError('El conductor seleccionado no tiene un vehículo vinculado. Por favor asígnale uno o selecciónalo manualmente.');
      return;
    }

    if (isExternal && !fletePagoManual) {
      setError('Para vehículos externos es obligatorio ingresar el Flete a Pagar negociado.');
      return;
    }
    
    if (selectedOperationId) {
      try {
        const flete = fletePagoManual ? Number(fletePagoManual) : undefined;

        if (isEmergencyReassign) {
          await reassignDriverAndVehicle(selectedOperationId, Number(selectedDriver), Number(selectedVehicle), flete);
        } else {
          await assignDriver(selectedOperationId, Number(selectedDriver), Number(selectedVehicle), flete);
        }
      } catch (err) {
        console.warn('La operación fue rechazada por el servidor.');
      } finally {
        handleClose();
      }
    }
  };

  const driverOptions = drivers.map(d => ({ value: d.id, label: d.name || 'Sin nombre' }));
  
  const vehicleOptions = vehicles.map(v => {
    const tag = v.affiliation === 'CORDIVEHICULOS' ? 'Propio' : v.affiliation === 'CORDIHUB' ? 'Afiliado' : 'Externo';
    return { value: v.id, label: `${v.plate} - ${v.brand || 'Mula'} (${tag})` };
  });

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        
        <h2 className={styles.title} style={{ color: isEmergencyReassign ? '#d97706' : '#0f172a' }}>
          {isEmergencyReassign ? '⚠️ Reasignación de Emergencia' : 'Asignar Conductor y Costear'}
        </h2>
        
        {isEmergencyReassign && (
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
            Esta operación está bloqueada. Selecciona el recurso de relevo para retomar la ruta.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          
          {/* 1. SELECCIONAR CONDUCTOR (Dispara el autocompletado del vehículo) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Conductor</label>
            <Select 
              value={selectedDriver}
              onChange={(e) => handleDriverChange(e.target.value)}
              options={driverOptions}
              error={error && !selectedDriver ? error : undefined} 
            />
          </div>

          {/* 2. VEHÍCULO (Se autocompleta con el del módulo de flotas, pero permite edición) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
              Vehículo Asignado <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#64748b' }}>(Autocompletado por flota)</span>
            </label>
            <Select 
              value={selectedVehicle}
              onChange={(e) => { setSelectedVehicle(e.target.value); setError(''); }}
              options={vehicleOptions}
              error={error && !selectedVehicle ? error : undefined} 
            />
          </div>

          {/* 3. FLETE MANUAL (Solo si el vehículo es EXTERNO) */}
          {isExternal && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                Flete a Pagar al Tercero (Negociado) *
              </label>
              <input
                type="number"
                placeholder="Ej: 950000"
                value={fletePagoManual}
                onChange={(e) => { setFletePagoManual(e.target.value); setError(''); }}
                style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Camión externo detectado. Se requiere valor neto de pago.
              </span>
            </div>
          )}

        </div>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            style={{ backgroundColor: isEmergencyReassign ? '#d97706' : undefined }}
          >
            {isEmergencyReassign ? 'Confirmar Relevo' : 'Asignar Vía WhatsApp'}
          </Button>
        </div>
      </div>
    </div>
  );
};