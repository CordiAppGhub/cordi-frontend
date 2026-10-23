'use client';

import React, { useMemo, useState } from 'react';
import { SuperForm } from '@/components/organisms/form/form';
import { FormField, FormFieldValue } from '@/components/organisms/form/types/form.types';
import { SuperModal } from '@/components/organisms/modal/modal';
import { tariffService } from '@/services/tariff.service';
import { showToast } from '@/utils/alerts';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';
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
      label: s.name,
    }));

    return [
      { name: 'surchargeCode', label: 'Concepto (Novedad / Recargo)', type: 'select', options: surchargeOptions },
      { name: 'quantity', label: 'Cantidad (Ej: Días o Eventos)', type: 'number', placeholder: '1' },
      { name: 'unitPrice', label: 'Cobro al cliente por unidad ($)', type: 'number', placeholder: 'Ej: 150000' },
      { name: 'costPrice', label: 'Costo (patio/proveedor) por unidad ($)', type: 'number', placeholder: 'Ej: 80000 (0 si no aplica)' },
      { name: 'observations', label: 'Observaciones (Opcional)', type: 'text', placeholder: 'Motivo del cobro extra' },
      { name: 'isPatioCharge', label: 'Es cargo de patio', type: 'checkbox' },
    ];
  }, [surcharges]);

  const handleSubmit = async (formData: Record<string, FormFieldValue>) => {
    setErrors({});
    if (!formData.surchargeCode) {
      setErrors({ surchargeCode: 'Debe seleccionar un concepto del catálogo' });
      return;
    }
    const unitPrice = Number(formData.unitPrice);
    if (formData.unitPrice === '' || formData.unitPrice == null || Number.isNaN(unitPrice) || unitPrice < 0) {
      setErrors({ unitPrice: 'Ingresa el valor a cobrar (0 si no se cobra)' });
      return;
    }

    if (!operationId) return;

    setIsSubmitting(true);
    try {
      await tariffService.applySurchargeToOperation({
        operationId,
        surchargeCode: String(formData.surchargeCode),
        quantity: Number(formData.quantity) || 1,
        unitPrice,
        costPrice: Number(formData.costPrice) || 0,
        observations: formData.observations ? String(formData.observations) : undefined,
        isPatioCharge: Boolean(formData.isPatioCharge),
      });
      showToast.success('Concepto aplicado exitosamente a la operación.');
      onClose();
    } catch (error) {
      showToast.error(getUserFriendlyErrorMessage(error, 'Error al aplicar el concepto.'));
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