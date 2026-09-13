import React, { useState, useEffect } from 'react';
import { useOperationStore } from '../../../../../store/use-operation.store';

import { Button } from '../../../../../components/atoms/button/button';
import styles from './assign-modal.module.css';
import { Select } from '@/components/atoms/select/select';
import { useUIStore } from '@/store/use-ui.store';
import { useDrivers } from '@/hooks/use-drivers';
import { useOperations } from '@/app/(panel)/operations/hooks/useOperations';

export const AssignModal: React.FC = () => {
  const { isAssignModalOpen, closeAssignModal, selectedOperationId } = useUIStore();
  const { drivers, loadDrivers: fetchDrivers } = useDrivers();
  const { assignDriver } = useOperations();
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isAssignModalOpen) fetchDrivers();
  }, [isAssignModalOpen, fetchDrivers]);

  if (!isAssignModalOpen) return null;

  const handleAssign = async () => {
    if (!selectedDriver) {
      setError('Debes seleccionar un conductor');
      return;
    }
    
    if (selectedOperationId) {
      try {
        await assignDriver(selectedOperationId, Number(selectedDriver));
      } catch (err) {
        console.warn('La asignación fue rechazada por el servidor.');
      } finally {
     
        closeAssignModal();
        setSelectedDriver(''); 
        setError(''); 
      }
    }
  };

  const driverOptions = drivers.map(d => ({ value: d.id, label: d.name || 'Sin nombre' }));

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Asignar Conductor</h2>
        <Select 
          value={selectedDriver}
          onChange={(e) => { setSelectedDriver(e.target.value); setError(''); }}
          options={driverOptions}
          error={error}
        />
        <div className={styles.actions}>
          <Button variant="secondary" onClick={closeAssignModal}>Cancelar</Button>
          <Button variant="primary" onClick={handleAssign}>Asignar Vía WhatsApp</Button>
        </div>
      </div>
    </div>
  );
};