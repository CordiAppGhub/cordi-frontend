'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useClients } from '@/hooks/useClient';
import { useLocations } from '../../locations/hooks/useLocation';
import { useTariffs } from '../hooks/useTariff';
import { formatLocationLabel } from '@/utils/location';
import { SuperForm } from '@/components/organisms/form/form';
import { FormField, FormFieldValue } from '@/components/organisms/form/types/form.types';
import { OperationType } from '@/types/tariff-ypes';

interface RouteTariffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RouteTariffModal: React.FC<RouteTariffModalProps> = ({ isOpen, onClose }) => {
  const { createTariff, isLoadingTariffs } = useTariffs();
  const { locations  } = useLocations();
  const { clients } = useClients();

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);



  const handleCloseModal = () => {
    setErrors({});
    setSelectedClientId(null);
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
        name: 'locationId',
        label: 'Bodega / Zona Franca (Opcional)',
        type: 'select',
        // Bloqueamos el campo si no hay cliente seleccionado para guiar al usuario
        disabled: !selectedClientId, 
        options: [
          { 
            value: '', 
            label: !selectedClientId 
              ? 'Seleccione un cliente primero...' 
              : '🌐 Aplica para cualquier ubicación (Tarifa Plana)' 
          },
          ...availableLocations.map(loc => ({ value: String(loc.id), label: formatLocationLabel(loc) }))
        ]
      },
      {
        name: 'price',
        label: 'Precio de Cobro (COP) *',
        type: 'number',
        placeholder: 'Ej: 900000'
      }
    ];
  }, [locations, clients, selectedClientId]);

  const handleFormChange = (name: string, value: FormFieldValue) => {
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // 🚀 NUEVO: Actualizamos el estado interno cuando cambian el cliente
    if (name === 'clientId') {
      setSelectedClientId(Number(value) || null);
    }
  };

  const handleSubmit = async (formData: Record<string, FormFieldValue>) => {
    const localErrors: Record<string, string> = {};

    if (!formData.clientId) localErrors.clientId = 'Seleccione el cliente';
    if (!formData.operationType) localErrors.operationType = 'Seleccione el tipo de operación';
    if (!formData.price || Number(formData.price) <= 0) localErrors.price = 'Ingrese un precio válido';

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }

    const payload = {
      clientId: Number(formData.clientId),
      operationType: String(formData.operationType) as OperationType,
      isAnticipada: formData.isAnticipada === 'true',
      locationId: formData.locationId ? Number(formData.locationId) : undefined,
      price: Number(formData.price),
    };

    const success = await createTariff(payload);
    if (success) {
      handleCloseModal();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Nueva Tarifa Comercial</h2>
        
        <SuperForm
          key={isOpen ? 'open' : 'closed'} 
          fields={formFields}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          onChange={handleFormChange}
          errors={errors}
          isLoading={isLoadingTariffs}
          submitText="Guardar Tarifa"
          cancelText="Cancelar"
        />
      </div>
    </div>
  );
};