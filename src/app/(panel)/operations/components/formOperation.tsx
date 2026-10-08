'use client';

import React from 'react';
import { SuperForm } from '@/components/organisms/form/form';
import { useOperationForm } from '../hooks/useOperationForm';
import { Operation } from '@/types/operation-types';

interface OperationFormProps {
  onClose: () => void;
  scheduleBase?: Operation | null;
}

export const OperationForm: React.FC<OperationFormProps> = ({ onClose, scheduleBase }) => {
  const { 
    formFields, 
    initialValues,
    handleSubmit, 
    handleFormChange, 
    errors, 
    isLoadingOperations,
    suggestedPrice,      
    isCalculatingPrice   
  } = useOperationForm(onClose, scheduleBase);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      <div 
        style={{ 
          padding: '12px 16px', 
          backgroundColor: '#eff6ff', 
          border: '1px solid #bfdbfe',
          borderRadius: '8px' 
        }}
      >
        {isCalculatingPrice ? (
          <span style={{ fontSize: '0.875rem', color: '#2563eb', fontWeight: 500 }}>
            ⏳ Consultando contrato del cliente...
          </span>
        ) : suggestedPrice ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.95rem', color: '#16a34a', fontWeight: 700 }}>
              💰 Flete de Cobro Sugerido: ${suggestedPrice.toLocaleString('es-CO')}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#475569' }}>
              Si dejas el campo Flete Manual en blanco, el sistema facturará este valor automáticamente basado en el contrato del cliente.
            </span>
          </div>
        ) : (
          <span style={{ fontSize: '0.875rem', color: '#d97706', fontWeight: 600 }}>
            ⚠️ Este cliente no tiene un contrato o tarifa configurada para esta bodega o zona. Deberás ingresar un flete manual.
          </span>
        )}
      </div>

      <SuperForm
        fields={formFields}
        onSubmit={handleSubmit}
        defaultValues={initialValues}
        onCancel={onClose}
        onChange={handleFormChange}
        errors={errors}
        isLoading={isLoadingOperations}
        submitText="Crear Operación"
        cancelText="Cancelar"
      />
    </div>
  );
};