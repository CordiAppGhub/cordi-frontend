'use client';

import { useState } from 'react';
import { Select } from '@/components/atoms/select/select';
import { SuperModal } from '@/components/organisms/modal/modal';
import { NovedadResourceForm } from './novedad-resource-form';
import { ResourceAbsenceForm } from './resource-absence-form';
import styles from './resource-registration-modal.module.css';

type RegistrationKind = 'NOVEDAD' | 'ABSENCE';

interface ResourceRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (kind: RegistrationKind) => void;
}

export function ResourceRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
}: ResourceRegistrationModalProps) {
  const [kind, setKind] = useState<RegistrationKind>('NOVEDAD');

  const handleClose = () => {
    setKind('NOVEDAD');
    onClose();
  };

  const handleSuccess = () => {
    onSuccess(kind);
    setKind('NOVEDAD');
  };

  return (
    <SuperModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Registrar novedad o ausencia"
      width="640px"
    >
      <div className={styles.content}>
        <label className={styles.typeField}>
          Tipo de registro
          <Select
            value={kind}
            onChange={(event) =>
              setKind(event.target.value as RegistrationKind)
            }
          >
            <option value="NOVEDAD">Novedad de personal o vehículo</option>
            <option value="ABSENCE">Ausencia formal</option>
          </Select>
          <span className={styles.helpText}>
            La novedad registra y da seguimiento a un incidente. La ausencia
            formal define un periodo y permite gestionar sustituciones o
            restaurar asignaciones.
          </span>
        </label>

        {kind === 'NOVEDAD' ? (
          <NovedadResourceForm
            onCancel={handleClose}
            onSuccess={handleSuccess}
          />
        ) : (
          <ResourceAbsenceForm
            onCancel={handleClose}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </SuperModal>
  );
}
