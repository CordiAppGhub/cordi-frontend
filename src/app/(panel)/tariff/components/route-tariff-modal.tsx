'use client';

import React, { useState, useMemo } from 'react';
import { useClients } from '@/hooks/useClient';
import { useLocations } from '../../locations/hooks/useLocation';
import { useTariffs } from '../hooks/useTariff';
import { formatLocationLabel } from '@/utils/location';
import { SuperForm } from '@/components/organisms/form/form';
import { FormField, FormFieldValue } from '@/components/organisms/form/types/form.types';
import { ClientTariff, OperationType } from '@/types/tariff-ypes';

interface RouteTariffModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ClientTariff | null;
}

export const RouteTariffModal: React.FC<RouteTariffModalProps> = ({ isOpen, onClose, initialData }) => {
  const { createTariff, updateTariff, isLoadingTariffs, vehicleTypes } = useTariffs();
  const { locations  } = useLocations();
  const { clients } = useClients();

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [selectedClientId, setSelectedClientId] = useState<number | null>(
    initialData?.clientId ?? null,
  );

  const defaultValues = useMemo(() => {
    if (!initialData) return {};
    return {
      clientId: String(initialData.clientId),
      operationType: initialData.operationType,
      isAnticipada: String(initialData.isAnticipada),
      cargoFormat: initialData.cargoFormat,
      originLocationId: initialData.originLocationId
        ? String(initialData.originLocationId)
        : '',
      destinationLocationId: initialData.destinationLocationId
        ? String(initialData.destinationLocationId)
        : '',
      containerSize: initialData.containerSize ?? '',
      vehicleTypeId: initialData.vehicleTypeId
        ? String(initialData.vehicleTypeId)
        : '',
      price: String(initialData.price),
    };
  }, [initialData]);

  const handleCloseModal = () => {
    setErrors({});
    setSelectedClientId(initialData?.clientId ?? null);
    onClose();
  };

  const formFields: FormField[] = useMemo(() => {
    const availableLocations = selectedClientId 
      ? locations.filter(loc => loc.clients?.some(c => c.clientId === selectedClientId))
      : [];

    return [
      {
        name: 'clientId',
        label: 'Cliente (Titular de la Tarifa) *',
        type: 'select',
        options: [
          { value: '', label: '-- Seleccionar Cliente --' },
          ...clients.map(client => ({ value: String(client.id), label: client.razonSocial }))
        ]
      },
      {
        name: 'operationType',
        label: 'Tipo de Operación *',
        type: 'select',
        options: [
          { value: '', label: '-- Seleccionar Operación --' },
          { value: 'EXPORTACION', label: 'Exportación' },
          { value: 'IMPORTACION', label: 'Importación' },
          { value: 'RETIRO_VACIO', label: 'Retiro de Vacío' },
          { value: 'DEVOLUCION', label: 'Devolución' },
          { value: 'NACIONAL', label: 'Nacional' },
          { value: 'CARGA_SUELTA_URBANA', label: 'Carga Suelta Urbana' },
          { value: 'CARGA_SUELTA_NACIONAL', label: 'Carga Suelta Nacional' },
          { value: 'MOVIMIENTO_INTERNO', label: 'Movimiento Interno' },
        ]
      },
      {
        name: 'isAnticipada',
        label: 'Modalidad del Servicio',
        type: 'select',
        options: [
          { value: 'false', label: 'Servicio Directo' },
          { value: 'true', label: 'Servicio Anticipado' }
        ]
      },
      {
        name: 'cargoFormat',
        label: 'Formato de carga *',
        type: 'radio',
        options: [
          { value: 'CONTENERIZADA', label: 'Contenerizada' },
          { value: 'SUELTA', label: 'Carga suelta' },
        ],
        fullWidth: true,
      },
      {
        name: 'originLocationId',
        label: 'Origen *',
        type: 'select',
        disabled: !selectedClientId,
        options: [
          { value: '', label: !selectedClientId ? 'Seleccione un cliente primero...' : '-- Seleccionar origen --' },
          ...availableLocations.map(loc => ({ value: String(loc.id), label: formatLocationLabel(loc) }))
        ]
      },
      {
        name: 'destinationLocationId',
        label: 'Destino *',
        type: 'select',
        disabled: !selectedClientId,
        options: [
          { value: '', label: !selectedClientId ? 'Seleccione un cliente primero...' : '-- Seleccionar destino --' },
          ...availableLocations.map(loc => ({ value: String(loc.id), label: formatLocationLabel(loc) }))
        ]
      },
      {
        name: 'containerSize',
        label: 'Tamaño del contenedor *',
        type: 'select',
        options: [
          { value: '', label: '-- Seleccionar tamaño --' },
          { value: 'DRY_20', label: 'DRY 20' },
          { value: 'DRY_40', label: 'DRY 40' },
          { value: 'HC_40', label: 'High Cube 40' },
          { value: 'REEFER_40', label: 'Reefer 40' },
          { value: 'FLAT_RACK', label: 'Flat Rack' },
          { value: 'OPEN_TOP', label: 'Open Top' },
        ],
        visible: (formData) => formData.cargoFormat === 'CONTENERIZADA',
      },
      {
        name: 'vehicleTypeId',
        label: 'Capacidad del vehículo *',
        type: 'select',
        options: [
          { value: '', label: '-- Seleccionar capacidad --' },
          ...vehicleTypes.map(vehicleType => ({
            value: String(vehicleType.id),
            label: vehicleType.name,
          })),
        ],
        visible: (formData) => formData.cargoFormat === 'SUELTA',
      },
      {
        name: 'price',
        label: 'Precio de Cobro (COP) *',
        type: 'number',
        placeholder: 'Ej: 900000'
      }
    ];
  }, [locations, clients, selectedClientId, vehicleTypes]);

  const handleFormChange = (name: string, value: FormFieldValue) => {
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (name === 'clientId') {
      setSelectedClientId(Number(value) || null);
    }
  };

  const handleSubmit = async (formData: Record<string, FormFieldValue>) => {
    const localErrors: Record<string, string> = {};

    if (!formData.clientId) localErrors.clientId = 'Seleccione el cliente';
    if (!formData.operationType) localErrors.operationType = 'Seleccione el tipo de operación';
    if (!formData.cargoFormat) localErrors.cargoFormat = 'Seleccione el formato de carga';
    if (!formData.originLocationId) localErrors.originLocationId = 'Seleccione el origen';
    if (!formData.destinationLocationId) localErrors.destinationLocationId = 'Seleccione el destino';
    if (formData.cargoFormat === 'CONTENERIZADA' && !formData.containerSize) {
      localErrors.containerSize = 'Seleccione el tamaño del contenedor';
    }
    if (formData.cargoFormat === 'SUELTA' && !formData.vehicleTypeId) {
      localErrors.vehicleTypeId = 'Seleccione la capacidad del vehículo';
    }
    if (!formData.price || Number(formData.price) <= 0) localErrors.price = 'Ingrese un precio válido';

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }

    const commonPayload = {
      clientId: Number(formData.clientId),
      operationType: String(formData.operationType) as OperationType,
      isAnticipada: formData.isAnticipada === 'true',
      cargoFormat: String(formData.cargoFormat) as 'CONTENERIZADA' | 'SUELTA',
      originLocationId: Number(formData.originLocationId),
      destinationLocationId: Number(formData.destinationLocationId),
      price: Number(formData.price),
    };
    const payload = formData.cargoFormat === 'SUELTA'
      ? {
          ...commonPayload,
          cargoFormat: 'SUELTA' as const,
          vehicleTypeId: Number(formData.vehicleTypeId),
        }
      : {
          ...commonPayload,
          cargoFormat: 'CONTENERIZADA' as const,
          containerSize: String(formData.containerSize) as 'DRY_20' | 'DRY_40' | 'HC_40' | 'REEFER_40' | 'FLAT_RACK' | 'OPEN_TOP',
        };

    const success = initialData
      ? await updateTariff(initialData.id, payload)
      : await createTariff(payload);
    if (success) {
      handleCloseModal();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
          {initialData ? 'Editar Tarifa Comercial' : 'Nueva Tarifa Comercial'}
        </h2>
        
        <SuperForm
          key={`${isOpen}-${initialData?.id ?? 'new'}`}
          fields={formFields}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          onChange={handleFormChange}
          errors={errors}
          isLoading={isLoadingTariffs}
          submitText={initialData ? 'Actualizar Tarifa' : 'Guardar Tarifa'}
          cancelText="Cancelar"
        />
      </div>
    </div>
  );
};