'use client';

import React, { useState } from 'react';
import { SuperForm } from '@/components/organisms/form/form';
import type {
  FormField,
  FormFieldValue,
} from '@/components/organisms/form/types/form.types';
import type { Operation, OperationSurcharge } from '@/types/operation-types';
import type { UpdateOperationSurchargeInput } from '@/services/tariff.service';
import { OperationPatioChargeSelector } from '../actions/operation-patio-charge-selector';

interface OperationSurchargeModalProps {
  surcharge: OperationSurcharge;
  operation: Operation;
  isSaving: boolean;
  onClose: () => void;
  onSave: (
    id: number,
    data: UpdateOperationSurchargeInput,
  ) => Promise<boolean>;
}

const fields: FormField[] = [
  {
    name: 'unitPrice',
    label: 'Valor unitario (COP) *',
    type: 'number',
    placeholder: 'Ej: 125000',
  },
  {
    name: 'quantity',
    label: 'Cantidad *',
    type: 'number',
    placeholder: 'Ej: 1',
  },
  {
    name: 'observations',
    label: 'Observaciones',
    type: 'textarea',
    placeholder: 'Detalles del recargo',
  },
];

export const OperationSurchargeModal: React.FC<
  OperationSurchargeModalProps
> = ({ surcharge, operation, isSaving, onClose, onSave }) => {
  const routePatios = new Map<number, string>();
  [operation.origen, operation.destino, ...(operation.stops ?? []).map((stop) => stop.location)]
    .forEach((location) => {
      if (location?.isDepot) routePatios.set(location.id, location.name);
    });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPatioCharge, setIsPatioCharge] = useState(
    surcharge.isPatioCharge === true,
  );
  const [patioLocationId, setPatioLocationId] = useState<number | null>(
    routePatios.size === 1
      ? [...routePatios.keys()][0]
      : surcharge.patioLocationId ?? surcharge.patioLocation?.id ?? null,
  );
  const defaultValues: Record<string, FormFieldValue> = {
    unitPrice: String(surcharge.appliedPrice),
    quantity: String(surcharge.quantity),
    observations: surcharge.observations ?? '',
  };

  const handleSubmit = async (values: Record<string, FormFieldValue>) => {
    const unitPrice = Number(values.unitPrice);
    const quantity = Number(values.quantity);
    const nextErrors: Record<string, string> = {};

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      nextErrors.unitPrice = 'El valor unitario debe ser mayor que cero.';
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      nextErrors.quantity = 'La cantidad debe ser un entero igual o mayor a 1.';
    }
    if (isPatioCharge && patioLocationId === null) {
      nextErrors.patioLocationId = 'Selecciona el patio asociado al cobro.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const saved = await onSave(surcharge.id, {
      unitPrice,
      quantity,
      observations: String(values.observations ?? ''),
      isPatioCharge,
      ...(isPatioCharge && patioLocationId !== null
        ? { patioLocationId }
        : {}),
    });
    if (saved) onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
    >
      <div
        style={{
          width: 'min(500px, 100%)',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 24,
          borderRadius: 12,
          backgroundColor: '#fff',
        }}
      >
        <h2>Editar recargo aplicado</h2>
        <OperationPatioChargeSelector
          operation={operation}
          isPatioCharge={isPatioCharge}
          patioLocationId={patioLocationId}
          disabled={isSaving}
          onPatioChargeChange={setIsPatioCharge}
          onPatioLocationChange={setPatioLocationId}
        />
        {errors.patioLocationId && (
          <p role="alert">{errors.patioLocationId}</p>
        )}
        <SuperForm
          key={surcharge.id}
          fields={fields}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          onCancel={onClose}
          onChange={(name) =>
            setErrors((previous) => ({ ...previous, [name]: '' }))
          }
          errors={errors}
          isLoading={isSaving}
          submitText="Actualizar recargo"
          cancelText="Cancelar"
        />
      </div>
    </div>
  );
};
