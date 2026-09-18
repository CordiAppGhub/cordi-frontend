import React, { useState, useEffect } from 'react';
import { Button } from '../../../../../components/atoms/button/button';
import { Select } from '@/components/atoms/select/select';
import { useUIStore } from '@/store/use-ui.store';
import { useOperations } from '@/app/(panel)/operations/hooks/useOperations';
import { useDrivers } from '@/app/(panel)/fleet/conductores/hooks/use-drivers';

// 👉 Asegúrate de tener/importar este hook para traer la lista de mulas disponibles

import styles from './assign-modal.module.css';
import { useVehicles } from '@/hooks/use-vehicles';

export const AssignModal: React.FC = () => {
  const { isAssignModalOpen, closeAssignModal, selectedOperationId } = useUIStore();
  
  // Traemos operaciones y las 2 funciones del hook
  const { operations, assignDriver, reassignDriverAndVehicle } = useOperations();
  
  // Flota
  const { drivers, loadDrivers } = useDrivers();
  const { vehicles, loadVehicles } = useVehicles();

  // Estados locales
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Identificamos el modo del modal basado en la operación seleccionada
  const operationTarget = operations.find(op => op.id === selectedOperationId);
  const isEmergencyReassign = operationTarget?.status === 'PAUSADA' || operationTarget?.status === 'EN_CURSO';

  useEffect(() => {
    if (isAssignModalOpen) {
      loadDrivers();
      loadVehicles(); // Cargamos vehículos al abrir
    }
  }, [isAssignModalOpen, loadDrivers, loadVehicles]);

  if (!isAssignModalOpen) return null;

  const handleSubmit = async () => {
    if (!selectedDriver) {
      setError('Debes seleccionar un conductor');
      return;
    }
    
    if (isEmergencyReassign && !selectedVehicle) {
      setError('Para un relevo de emergencia debes asignar un vehículo.');
      return;
    }
    
    if (selectedOperationId) {
      try {
        if (isEmergencyReassign) {
          // Llama al endpoint nuevo (Relevo en ruta)
          await reassignDriverAndVehicle(selectedOperationId, Number(selectedDriver), Number(selectedVehicle));
        } else {
          // Llama al endpoint tradicional (Primer despacho)
          await assignDriver(selectedOperationId, Number(selectedDriver));
        }
      } catch (err) {
        console.warn('La operación fue rechazada por el servidor.');
      } finally {
        closeAssignModal();
        setSelectedDriver(''); 
        setSelectedVehicle('');
        setError(''); 
      }
    }
  };

  // Filtramos opciones (Opcional: puedes filtrar para que solo salgan los isAvailable === true)
  const driverOptions = drivers.map(d => ({ value: d.id, label: d.name || 'Sin nombre' }));
  const vehicleOptions = vehicles.map(v => ({ value: v.id, label: `${v.plate} - ${v.brand || 'Mula'}` }));

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        
        {/* Cabecera Dinámica */}
        <h2 className={styles.title} style={{ color: isEmergencyReassign ? '#d97706' : '#0f172a' }}>
          {isEmergencyReassign ? '⚠️ Reasignación de Emergencia' : 'Asignar Conductor Inicial'}
        </h2>
        
        {isEmergencyReassign && (
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
            Esta operación está bloqueada. Selecciona el recurso de relevo para retomar la ruta.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          
          <Select 
            value={selectedDriver}
            onChange={(e) => { setSelectedDriver(e.target.value); setError(''); }}
            options={driverOptions}
            error={isEmergencyReassign ? undefined : error} 
          />

          {/* Si es reasignación, OBLIGAMOS a escoger la nueva mula */}
          {isEmergencyReassign && (
            <Select 
              value={selectedVehicle}
              onChange={(e) => { setSelectedVehicle(e.target.value); setError(''); }}
              options={vehicleOptions}
              error={error} 
            />
          )}

        </div>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={closeAssignModal}>Cancelar</Button>
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