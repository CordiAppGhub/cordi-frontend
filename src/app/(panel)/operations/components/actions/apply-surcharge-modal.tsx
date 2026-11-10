'use client';

import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SuperForm } from '@/components/organisms/form/form';
import { FormField, FormFieldValue } from '@/components/organisms/form/types/form.types';
import { SuperModal } from '@/components/organisms/modal/modal';
import { tariffService } from '@/services/tariff.service';
import { showToast } from '@/utils/alerts';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';
import { useTariffs } from '@/app/(panel)/tariff/hooks/useTariff';
import { operationService } from '@/services/operation.service';


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
  const queryClient = useQueryClient();
  const operationQuery = useQuery({
    queryKey: ['trafico-detail', operationId],
    queryFn: () => operationService.getOperationById(operationId!),
    enabled: isOpen && operationId !== null,
  });
  const availableNovedades = operationQuery.data?.historialNovedades;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formFields: FormField[] = useMemo(() => {
    const surchargeOptions = (surcharges || []).map(s => ({
      value: s.code,
      label: s.name,
    }));

    return [
      { name: 'surchargeCode', label: 'Concepto (Novedad / Recargo)', type: 'select', options: surchargeOptions },
      {
        name: 'novedadId',
        label: 'Novedad relacionada (Opcional)',
        type: 'select',
        options: [
          { value: '', label: 'Sin asociar a una novedad' },
          ...(availableNovedades ?? []).map((novedad) => ({
            value: novedad.id,
            label: `#${novedad.id} · ${novedad.category?.replaceAll('_', ' ') || 'Novedad'} · ${novedad.description.slice(0, 55)}`,
          })),
        ],
        disabled: operationQuery.isLoading || !availableNovedades?.length,
      },
      { name: 'quantity', label: 'Cantidad (Ej: Días o Eventos)', type: 'number', placeholder: '1' },
      { name: 'unitPrice', label: 'Cobro al cliente por unidad ($)', type: 'number', placeholder: 'Ej: 150000' },
      { name: 'costPrice', label: 'Costo (patio/proveedor) por unidad ($)', type: 'number', placeholder: 'Ej: 80000 (0 si no aplica)' },
      { name: 'observations', label: 'Observaciones (Opcional)', type: 'text', placeholder: 'Motivo del cobro extra' },
      { name: 'isPatioCharge', label: 'Es cargo de patio', type: 'checkbox' },
    ];
  }, [surcharges, availableNovedades, operationQuery.isLoading]);

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
        ...(formData.novedadId
          ? { novedadId: Number(formData.novedadId) }
          : {}),
        surchargeCode: String(formData.surchargeCode),
        quantity: Number(formData.quantity) || 1,
        unitPrice,
        costPrice: Number(formData.costPrice) || 0,
        observations: formData.observations ? String(formData.observations) : undefined,
        isPatioCharge: Boolean(formData.isPatioCharge),
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['trafico-detail', operationId] }),
        queryClient.invalidateQueries({ queryKey: ['trafico'] }),
        queryClient.invalidateQueries({ queryKey: ['trafico-client-operations'] }),
        queryClient.invalidateQueries({ queryKey: ['profiles'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
      ]);
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
      <p>
        El cobro y el costo se ingresan manualmente. Al aplicarlo, el valor se
        incluye en la liquidación de la operación.
      </p>
      {operationQuery.isError && (
        <p role="alert">
          No se pudieron cargar las novedades de esta operación. Puedes aplicar
          el cobro sin asociarlo a una novedad.
        </p>
      )}
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