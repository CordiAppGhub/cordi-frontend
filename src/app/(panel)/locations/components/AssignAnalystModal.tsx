'use client';

import React from 'react';
import { SuperModal } from '@/components/organisms/modal/modal';

import { useAnalysts } from '@/hooks/useAnalysts';
import { SuperForm } from '@/components/organisms/form/form';
import { FormField } from '@/components/organisms/form/types/form.types';

interface AssignAnalystModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: number | null;
  entityName: string;
  currentAnalystId?: number;
  isAssigning: boolean;
  onAssign: (id: number, analystId: number) => Promise<boolean>;
}

export const AssignAnalystModal: React.FC<AssignAnalystModalProps> = ({
  isOpen,
  onClose,
  entityId,
  entityName,
  currentAnalystId,
  isAssigning,
  onAssign,
}) => {
  const { analysts, isLoadingAnalysts } = useAnalysts();

  if (!isOpen || !entityId) return null;

  const analystOptions = [
    { value: '', label: '-- Seleccionar un analista --' },
    ...analysts.map(a => ({ value: String(a.id), label: a.name }))
  ];

  const formFields: FormField[] = [
    {
      name: 'analystId',
      label: `Analista responsable para: ${entityName}`,
      type: 'select',
      options: analystOptions,
      disabled: isLoadingAnalysts,
    },
  ];

  const handleSubmit = async (formData: Record<string, any>) => {
    const analystId = Number(formData.analystId);
    if (!analystId) {
      SweetAlert('Debes seleccionar un analista para continuar.');
      return;
    }

    const success = await onAssign(entityId, analystId);
    if (success) onClose();
  };

  return (
    <SuperModal
      isOpen={isOpen}
      onClose={onClose}
      title="Asignar Analista"
      width="450px"
    >
      <div style={{ marginBottom: '16px', fontSize: '0.9rem', color: '#64748b' }}>
        El analista seleccionado será el encargado de gestionar las operaciones y novedades de <strong>{entityName}</strong>.
      </div>
      
      {isLoadingAnalysts ? (
        <p>Cargando lista de analistas...</p>
      ) : (
        <SuperForm
          fields={formFields}
          defaultValues={{ analystId: currentAnalystId ? String(currentAnalystId) : '' }}
          isLoading={isAssigning}
          submitText="Confirmar Asignación"
          cancelText="Cerrar"
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      )}
    </SuperModal>
  );
};

function SweetAlert(arg0: string) {
  throw new Error('Function not implemented.');
}
