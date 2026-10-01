'use client';

import React, { useMemo, useState } from 'react';
import { SuperForm } from '@/components/organisms/form/form';
import { FormField, FormFieldValue } from '@/components/organisms/form/types/form.types';
import { SuperModal } from '@/components/organisms/modal/modal';
import { tariffService } from '@/services/tariff.service';
import { showToast } from '@/utils/alerts';
import { useTariffs } from '../../tariff/hooks/useTariff';


interface ApplySurchargeModalProps {
  operationId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ApplySurchargeModal: React.FC<ApplySurchargeModalProps> = ({ 
  operationId, 
  isOpen, 
  onClose 
}) => {
  const { surcharges } = useTariffs();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formFields: FormField[] = useMemo(() => {
    const surchargeOptions = (surcharges || []).map(s => ({
      value: s.code,
      label: `${s.name} (Base: $${s.basePrice.toLocaleString('es-CO')})`
    }));

    return [
      { name: 'surchargeCode', label: 'Tipo de Recargo / Novedad', type: 'select', options: surchargeOptions },
      { name: 'quantity', label: 'Cantidad (Ej: Días o Eventos)', type: 'number', placeholder: '1' },
      { name: 'observations', label: 'Observaciones (Opcional)', type: 'text', placeholder: 'Motivo del cobro extra' },
    ];
  }, [surcharges]);

  const handleSubmit = async (formData: Record<string, FormFieldValue>) => {
    setErrors({});
    if (!formData.surchargeCode) {
      setErrors({ surchargeCode: 'Debe seleccionar un recargo del catálogo' });
      return;
    }

    if (!operationId) return;

    setIsSubmitting(true);
    try {
      await tariffService.applySurchargeToOperation({
        operationId,
        surchargeCode: String(formData.surchargeCode),
        quantity: Number(formData.quantity) || 1,
        observations: formData.observations ? String(formData.observations) : undefined,
      });
      showToast.success('Recargo aplicado exitosamente a la operación.');
      onClose();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Error al aplicar el recargo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SuperModal
      isOpen={isOpen}
      onClose={onClose}
      title={operationId ? `💰 Añadir Costo Extra a Operación #${operationId}` : '💰 Añadir Costo Extra'}
      width="500px"
    >
      <SuperForm
        fields={formFields}
        onSubmit={handleSubmit}
        onCancel={onClose}
        errors={errors}
        isLoading={isSubmitting}
        submitText="Aplicar Cobro"
        cancelText="Cancelar"
      />
    </SuperModal>
  );
};