'use client';

import React, { useState } from 'react';
import { SuperForm } from '@/components/organisms/form/form';
import { useSurchargeForm } from '../hooks/useSurchargeForm';

interface SurchargeFormsModalProps {
  onClose: () => void;
}

export const SurchargeFormsModal: React.FC<SurchargeFormsModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'OVERRIDE'>('CATALOG');
  const { 
    catalogFormFields, handleCatalogSubmit, 
    overrideFormFields, handleOverrideSubmit, 
    errors, isSubmitting 
  } = useSurchargeForm(onClose);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Pestañas de Navegación */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
        <button 
          onClick={() => setActiveTab('CATALOG')}
          style={{ 
            padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold',
            backgroundColor: activeTab === 'CATALOG' ? '#2563eb' : 'transparent',
            color: activeTab === 'CATALOG' ? 'white' : '#64748b',
            border: 'none', cursor: 'pointer'
          }}
        >
          Novedad Global (Catálogo)
        </button>
        <button 
          onClick={() => setActiveTab('OVERRIDE')}
          style={{ 
            padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold',
            backgroundColor: activeTab === 'OVERRIDE' ? '#2563eb' : 'transparent',
            color: activeTab === 'OVERRIDE' ? 'white' : '#64748b',
            border: 'none', cursor: 'pointer'
          }}
        >
          Precio Especial por Cliente
        </button>
      </div>

      {activeTab === 'CATALOG' ? (
        <SuperForm
          fields={catalogFormFields}
          onSubmit={handleCatalogSubmit}
          onCancel={onClose}
          errors={errors}
          isLoading={isSubmitting}
          submitText="Guardar Novedad Base"
          cancelText="Cancelar"
        />
      ) : (
        <SuperForm
          fields={overrideFormFields}
          onSubmit={handleOverrideSubmit}
          onCancel={onClose}
          errors={errors}
          isLoading={isSubmitting}
          submitText="Guardar Precio Especial"
          cancelText="Cancelar"
        />
      )}
    </div>
  );
};