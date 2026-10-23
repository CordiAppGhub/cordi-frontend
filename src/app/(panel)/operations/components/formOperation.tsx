'use client';

import React, { useState } from 'react';
import { SuperForm } from '@/components/organisms/form/form';
import { useOperationForm } from '../hooks/useOperationForm';
import { Operation } from '@/types/operation-types';
import { useAuthStore } from '@/store/use-auth.store';
import { Drawer } from '@/components/Drawer';
import { Tabs } from '@/components/molecules/tabs/tabs';
import 'react-datepicker/dist/react-datepicker.css';

interface OperationFormProps {
  isOpen: boolean; // El componente padre debe controlar si está abierto o no
  onClose: () => void;
  scheduleBase?: Operation | null;
}

export const OperationForm: React.FC<OperationFormProps> = ({ isOpen, onClose, scheduleBase }) => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('general');

  const {
    categorizedFields,
    initialValues,
    handleSubmit,
    handleFormChange,
    errors,
    isLoadingOperations,
    suggestedPrice,
    isCalculatingPrice,
    shippingLinesError,
  } = useOperationForm(onClose, scheduleBase);

  const tabsConfig = [
    { id: 'general', label: 'General & Ruta' },
    { id: 'carga', label: 'Datos de Carga' },
    { id: 'liquidacion', label: 'Liquidación' }
  ];

  // Determinar qué campos mostrar según la pestaña activa
  const currentFields =
    activeTab === 'general' ? categorizedFields.generalFields :
      activeTab === 'carga' ? categorizedFields.cargaFields :
        categorizedFields.liquidacionFields;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        scheduleBase
          ? `Editar Operación #${scheduleBase.id}`
          : user?.role === 'ANALISTA'
            ? 'Crear solicitud de operación'
            : 'Crear Nueva Operación'
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {shippingLinesError && !scheduleBase && (
          <div role="alert" style={{ color: '#b91c1c' }}>
            No se pudieron cargar las líneas navieras. Cierra y vuelve a abrir el formulario para reintentar.
          </div>
        )}

        {/* Componente TABS */}
        <Tabs
          tabs={tabsConfig}
          activeTab={activeTab}
          onChange={setActiveTab}
          fullWidth={true}
        />

        {/* Panel Informativo de Tarifa (Solo se muestra en la pestaña de Liquidación o General) */}
        {(activeTab === 'general' || activeTab === 'liquidacion') && (
          <div style={{ padding: '12px 16px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px' }}>
            {isCalculatingPrice ? (
              <span style={{ fontSize: '0.875rem', color: '#2563eb', fontWeight: 500 }}>
                ⏳ Consultando contrato del cliente...
              </span>
            ) : suggestedPrice ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.95rem', color: '#16a34a', fontWeight: 700 }}>
                  💰 Flete Sugerido: ${suggestedPrice.toLocaleString('es-CO')}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#475569' }}>
                  Si dejas Flete Manual en blanco, se facturará este valor según contrato.
                </span>
              </div>
            ) : (
              <span style={{ fontSize: '0.875rem', color: '#d97706', fontWeight: 600 }}>
                ⚠️ Este cliente no tiene tarifa comercial para esta ruta. Deberás ingresar un flete manual.
              </span>
            )}
          </div>
        )}

        {/* El Formulario dinámico */}
        <SuperForm
          fields={currentFields} // Cambia dinámicamente según el Tab
          onSubmit={handleSubmit}
          defaultValues={initialValues}
          onCancel={onClose}
          onChange={handleFormChange}
          errors={errors}
          isLoading={isLoadingOperations}
          submitText={
            scheduleBase
              ? 'Guardar cambios'
              : user?.role === 'ANALISTA'
                ? 'Enviar a flota'
                : 'Crear Operación'
          }
          cancelText="Cancelar"
        />
      </div>
    </Drawer>
  );
};