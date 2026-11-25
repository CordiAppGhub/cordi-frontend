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
import { OperationPatioChargeSelector } from './operation-patio-charge-selector';


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
  const [isPatioCharge, setIsPatioCharge] = useState(false);
  const [patioLocationId, setPatioLocationId] = useState<number | null>(null);

  const closeModal = () => {
    setIsPatioCharge(false);
    setPatioLocationId(null);
    onClose();
  };

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
            label: `#${novedad.id} · ${novedad.category ?? 'Novedad'} · ${novedad.description.slice(0, 55)}`,
          })),
        ],
        disabled: operationQuery.isLoading || !availableNovedades?.length,
      },
      { name: 'quantity', label: 'Cantidad (Ej: Días o Eventos)', type: 'number', placeholder: '1' },
      { name: 'unitPrice', label: 'Cobro al cliente por unidad ($)', type: 'number', placeholder: 'Ej: 150000' },
      { name: 'costPrice', label: operationQuery.data?.isContainerized === true
        ? 'Costo (patio/proveedor) por unidad ($)'
        : 'Costo del proveedor por unidad ($)', type: 'number', placeholder: 'Ej: 80000 (0 si no aplica)' },
      { name: 'observations', label: 'Observaciones (Opcional)', type: 'text', placeholder: 'Motivo del cobro extra' },
    ];
  }, [
    surcharges,
    availableNovedades,
    operationQuery.isLoading,
    operationQuery.data?.isContainerized,
  ]);

  const handleSubmit = async (formData: Record<string, FormFieldValue>) => {
    setErrors({});
    if (!formData.surchargeCode) {
      setErrors({ surchargeCode: 'Debe seleccionar un concepto del catálogo' });
      return;
    }
    const unitPrice = Number(formData.unitPrice);
    if (formData.unitPrice === '' || formData.unitPrice == null || Number.isNaN(unitPrice) || unitPrice <= 0) {
      setErrors({ unitPrice: 'Ingresa un valor a cobrar mayor que cero' });
      return;
    }

    if (!operationId) return;
    if (isPatioCharge && patioLocationId === null) {
      showToast.error('Selecciona el patio asociado al cobro.');
      return;
    }

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
        isPatioCharge,
        ...(isPatioCharge && patioLocationId !== null
          ? { patioLocationId }
          : {}),
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['trafico-detail', operationId] }),
        queryClient.invalidateQueries({ queryKey: ['trafico'] }),
        queryClient.invalidateQueries({ queryKey: ['trafico-client-operations'] }),
        queryClient.invalidateQueries({ queryKey: ['profiles'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
      ]);
      showToast.success('Concepto aplicado exitosamente a la operación.');
      closeModal();
    } catch (error) {
      showToast.error(getUserFriendlyErrorMessage(error, 'Error al aplicar el concepto.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SuperModal
      isOpen={isOpen}
      onClose={closeModal}
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
      <OperationPatioChargeSelector
        operation={operationQuery.data}
        isPatioCharge={isPatioCharge}
        patioLocationId={patioLocationId}
        disabled={isSubmitting}
        onPatioChargeChange={setIsPatioCharge}
        onPatioLocationChange={setPatioLocationId}
      />
      <SuperForm
        fields={formFields}
        onSubmit={handleSubmit}
        onCancel={closeModal}
        errors={errors}
        isLoading={isSubmitting}
        submitText="Aplicar Cobro"
        cancelText="Cancelar"
      />
    </SuperModal>
  );
};