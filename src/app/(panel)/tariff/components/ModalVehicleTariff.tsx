'use client';

import React, { useState, useMemo } from 'react';
import { useTariffs } from '../hooks/useTariff';
import { SuperForm } from '@/components/organisms/form/form';
import { FormField, FormFieldValue } from '@/components/organisms/form/types/form.types';
import { AffiliationTariff, CreateAffiliationTariffInput, VehicleAffiliation } from '@/types/tariff-ypes';

interface VehicleTariffModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: AffiliationTariff | null;
}

export const VehicleTariffModal: React.FC<VehicleTariffModalProps> = ({ 
  isOpen, 
  onClose, 
  initialData 
}) => {
  const { createVehicleTariff, isLoadingVehicles } = useTariffs();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCloseModal = () => {
    setErrors({});
    onClose();
  };

  const formFields: FormField[] = useMemo(() => [
    {
      name: 'affiliation',
      label: 'Tipo de Propietario / Flota',
      type: 'select',
      options: [
        { value: '', label: '-- Seleccionar Tipo --' },
        { value: 'CORDIVEHICULOS', label: 'Cordivehículos (Flota Propia)' },
        { value: 'CORDIHUB', label: 'Cordihub (Fidelizados)' },
        { value: 'TERCEROS', label: 'Terceros (Vehículos Externos)' }
      ],
      disabled: !!initialData, 
    },
    {
      name: 'percentage',
      label: 'Porcentaje de Retención (%)',
      type: 'number',
      placeholder: 'Ej: 10',
    },
    {
      name: 'description',
      label: 'Descripción o Notas (Opcional)',
      type: 'text',
      placeholder: 'Ej: Retención base para flota',
    }
  ], [initialData]);

  const handleFormChange = (name: string, value: FormFieldValue) => {
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (formData: Record<string, FormFieldValue>) => {
    const localErrors: Record<string, string> = {};

    if (!formData.affiliation) localErrors.affiliation = 'Seleccione el tipo de flota';
    if (formData.percentage === undefined || formData.percentage === '' || Number(formData.percentage) < 0) {
      localErrors.percentage = 'Ingrese un porcentaje válido';
    }

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }

    const payload: CreateAffiliationTariffInput = {
      affiliation: String(formData.affiliation) as VehicleAffiliation,
      percentage: Number(formData.percentage),
      description: formData.description ? String(formData.description) : undefined,
    };

    const success = await createVehicleTariff(payload);
    if (success) {
      handleCloseModal();
    }
  };

  const defaultValues: Record<string, FormFieldValue> = initialData 
    ? {
        affiliation: initialData.affiliation,
        percentage: initialData.percentage,
        description: initialData.description || '',
      }
    : {};

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
          {initialData ? "Editar Tarifa de Flota" : "Nueva Tarifa de Flota"}
        </h2>
        
        <SuperForm
          key={isOpen ? `open-${initialData?.id || 'new'}` : 'closed'} 
          fields={formFields}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          onChange={handleFormChange}
          errors={errors}
          isLoading={isLoadingVehicles}
          submitText={initialData ? "Actualizar Tarifa" : "Guardar Tarifa"}
          cancelText="Cancelar"
        />
      </div>
    </div>
  );
};