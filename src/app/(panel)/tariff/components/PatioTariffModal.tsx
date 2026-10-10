'use client';

import React, { useMemo, useState } from 'react';
import { useClients } from '@/hooks/useClient';
import { useLocations } from '../../locations/hooks/useLocation';
import { SuperForm } from '@/components/organisms/form/form';
import { FormField, FormFieldValue } from '@/components/organisms/form/types/form.types';
import { useTariffs } from '../hooks/useTariff';

interface PatioTariffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PatioTariffModal: React.FC<PatioTariffModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { upsertPatioTariff, isLoadingTariffs } = useTariffs();
  const { locations } = useLocations();
  const { clients } = useClients();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formFields: FormField[] = useMemo(
    () => [
      {
        name: 'locationId',
        label: 'Patio *',
        type: 'select',
        options: [
          { value: '', label: '-- Seleccionar Patio --' },
          ...locations
            .filter((location) => location.isDepot)
            .map((location) => ({
              value: String(location.id),
              label: location.name,
            })),
        ],
      },
      {
        name: 'clientId',
        label: 'Cliente *',
        type: 'select',
        options: [
          { value: '', label: '-- Seleccionar Cliente --' },
          ...clients.map((client) => ({
            value: String(client.id),
            label: client.razonSocial,
          })),
        ],
      },
      {
        name: 'paymentPrice',
        label: 'Costo que cobra el patio a la empresa (COP) *',
        type: 'number',
        placeholder: 'Ej: 80000',
      },
      {
        name: 'billingPrice',
        label: 'Valor que se factura al cliente (COP) *',
        type: 'number',
        placeholder: 'Ej: 110000',
      },
    ],
    [clients, locations],
  );

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const handleSubmit = async (formData: Record<string, FormFieldValue>) => {
    const nextErrors: Record<string, string> = {};
    const paymentPrice = Number(formData.paymentPrice);
    const billingPrice = Number(formData.billingPrice);

    if (!formData.locationId) nextErrors.locationId = 'Seleccione el patio';
    if (!formData.clientId) nextErrors.clientId = 'Seleccione el cliente';
    if (formData.paymentPrice === '' || !Number.isFinite(paymentPrice) || paymentPrice < 0) {
      nextErrors.paymentPrice = 'Ingrese un costo válido (igual o mayor a 0)';
    }
    if (formData.billingPrice === '' || !Number.isFinite(billingPrice) || billingPrice < 0) {
      nextErrors.billingPrice = 'Ingrese un valor válido (igual o mayor a 0)';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const saved = await upsertPatioTariff({
      locationId: Number(formData.locationId),
      clientId: Number(formData.clientId),
      paymentPrice,
      billingPrice,
    });

    if (saved) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '12px',
          width: '500px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
          Tarifa de patio por cliente
        </h2>
        <SuperForm
          key={isOpen ? 'open' : 'closed'}
          fields={formFields}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          errors={errors}
          isLoading={isLoadingTariffs}
          submitText="Guardar tarifa"
          cancelText="Cancelar"
        />
      </div>
    </div>
  );
};
