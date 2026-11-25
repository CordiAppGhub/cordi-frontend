'use client';

import React from 'react';
import { SuperForm } from '@/components/organisms/form/form';
import { useSurchargeForm } from '../hooks/useSurchargeForm';
import type { SurchargeCatalog } from '@/types/tariff-ypes';

interface SurchargeFormsModalProps {
  onClose: () => void;
  initialData?: SurchargeCatalog | null;
}

export const SurchargeFormsModal: React.FC<SurchargeFormsModalProps> = ({
  onClose,
  initialData,
}) => {
  const {
    catalogFormFields,
    defaultValues,
    handleCatalogSubmit,
    errors,
    isSubmitting,
  } = useSurchargeForm(onClose, initialData);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
        {initialData
          ? 'El código técnico no se puede modificar. El valor aplicado a cada operación se ingresa por separado.'
          : 'El valor se digita manualmente en la operación (botón $).'}
      </p>
      <SuperForm
        key={initialData?.code ?? 'new'}
        fields={catalogFormFields}
        defaultValues={defaultValues}
        onSubmit={handleCatalogSubmit}
        onCancel={onClose}
        errors={errors}
        isLoading={isSubmitting}
        submitText={initialData ? 'Actualizar Concepto' : 'Guardar Concepto'}
        cancelText="Cancelar"
      />
    </div>
  );
};
