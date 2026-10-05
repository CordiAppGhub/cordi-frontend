'use client';

import React from 'react';
import { Locations } from '@/types/location.types';
import { SuperModal } from '@/components/organisms/modal/modal';
import { SuperForm } from '@/components/organisms/form/form';
import { useLocationModal } from '../../hooks/useLocationModal';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationToEdit?: Locations | null;
}

export const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose, locationToEdit }) => {
  const {
    defaultValues,
    formFields,
    validationErrors,
    isLoading,
    handleSubmit,
    clearErrors,
  } = useLocationModal({ isOpen, onClose, locationToEdit });

  if (!isOpen) return null;

  return (
    <SuperModal
      isOpen={isOpen}
      onClose={onClose}
      title={locationToEdit ? 'Editar Ubicación' : 'Registrar Nueva Ubicación'}
      width="700px"
    >
      <SuperForm
        fields={formFields}
        defaultValues={defaultValues}
        errors={validationErrors}
        isLoading={isLoading}
        submitText={locationToEdit ? 'Actualizar' : 'Guardar'}
        cancelText="Cancelar"
        onSubmit={handleSubmit}
        onCancel={onClose}
        onChange={clearErrors}
      />
    </SuperModal>
  );
};