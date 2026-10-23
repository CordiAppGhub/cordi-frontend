'use client';

import React from 'react';
import { SuperForm } from '@/components/organisms/form/form';
import { useSurchargeForm } from '../hooks/useSurchargeForm';

interface SurchargeFormsModalProps {
  onClose: () => void;
}

export const SurchargeFormsModal: React.FC<SurchargeFormsModalProps> = ({ onClose }) => {
  const { catalogFormFields, handleCatalogSubmit, errors, isSubmitting } = useSurchargeForm(onClose);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
        Solo se crea el concepto. El valor se digita manualmente en la operación (botón $).
      </p>
      <SuperForm
        fields={catalogFormFields}
        onSubmit={handleCatalogSubmit}
        onCancel={onClose}
        errors={errors}
        isLoading={isSubmitting}
        submitText="Guardar Concepto"
        cancelText="Cancelar"
      />
    </div>
  );
};
