// src/app/(panel)/novedades/components/novedad-form/novedad-form.tsx
'use client';

import React, { useState } from 'react';
import styles from './novedad-modal.module.css';
import {
  CATEGORIES_BY_TARGET,
  NOVEDAD_CATEGORY_LABELS,
  type NovedadTarget,
  novedadesService,
  type NovedadCategory,
} from '@/services/novedades.servies';
import { SuperForm } from '@/components/organisms/form/form';
import {
  FormField,
  FormFieldValue,
} from '@/components/organisms/form/types/form.types';
import { Operation } from '@/types/operation-types';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';

interface NovedadFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  operationId: number;
  rawOperation?: Operation;
}

export function NovedadForm({ onSuccess, onCancel, operationId, rawOperation }: NovedadFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentSeverity, setCurrentSeverity] = useState('MEDIUM');
  const [currentTarget, setCurrentTarget] = useState<NovedadTarget>('OPERATION');

  const resolvedVehicleId = rawOperation?.vehicleId ?? rawOperation?.vehicle?.id;
  const resolvedDriverId = rawOperation?.driverId ?? rawOperation?.driver?.id;

  const formFields: FormField[] = [
  {
    name: 'target',
    label: '¿A qué recurso afecta esta incidencia?',
    type: 'select',
    options: [
      { value: 'OPERATION', label: '📦 A la Operación / Viaje en curso' },
      { value: 'VEHICLE', label: `🚚 Al Vehículo ${resolvedVehicleId ? '(Asignado)' : '(No asignado)'}` },
      { value: 'DRIVER', label: `👤 Al Conductor ${resolvedDriverId ? '(Asignado)' : '(No asignado)'}` },
    ],
  },
  {
    name: 'category',
    label: 'Motivo específico',
    type: 'select',
    options: CATEGORIES_BY_TARGET[currentTarget].map((category) => ({
      value: category,
      label: NOVEDAD_CATEGORY_LABELS[category],
    })),
  },
  {
    name: 'severity',
    label: 'Nivel de Severidad / Impacto',
    type: 'select',
    options: [
      { value: 'LOW', label: 'Baja (Observación menor)' },
      { value: 'MEDIUM', label: 'Media (Retraso o advertencia)' },
      { value: 'HIGH', label: 'Alta (Falla grave / Bloqueo)' },
      { value: 'CRITICAL', label: 'Crítica (Inhabilitación)' },
    ],
  },
  {
    name: 'description',
    label: 'Descripción detallada del problema',
    type: 'textarea', 
    placeholder: 'Ej. Conductor reporta llanta pinchada, trancón de 3 horas o desvío en ruta...',
  },
  ];

  const handleFormChange = (name: string, value: FormFieldValue) => {
    if (name === 'severity' && typeof value === 'string') {
      setCurrentSeverity(value);
    }
    if (
      name === 'target' &&
      typeof value === 'string' &&
      ['OPERATION', 'VEHICLE', 'DRIVER'].includes(value)
    ) {
      setCurrentTarget(value as NovedadTarget);
    }
  };

  const handleSuperSubmit = async (formData: Record<string, FormFieldValue>) => {
    const target = formData.target;
    const severity = formData.severity;
    const description =
      typeof formData.description === 'string'
        ? formData.description.trim()
        : '';
    const category = formData.category;

    if (
      typeof target !== 'string' ||
      !(target in CATEGORIES_BY_TARGET) ||
      typeof severity !== 'string'
    ) {
      setError('Completa el tipo de recurso y la severidad.');
      return;
    }
    if (description.length < 20) {
      setError('El detalle debe tener al menos 20 caracteres.');
      return;
    }
    if (
      typeof category !== 'string' ||
      !CATEGORIES_BY_TARGET[target as NovedadTarget].includes(
        category as NovedadCategory,
      )
    ) {
      setError('Selecciona un motivo válido para el recurso afectado.');
      return;
    }
    if (target === 'VEHICLE' && !resolvedVehicleId) return setError('Esta operación no tiene vehículo asignado.');
    if (target === 'DRIVER' && !resolvedDriverId) return setError('Esta operación no tiene conductor asignado.');

    setLoading(true);
    setError(null);

    try {
      await novedadesService.create({
        description,
        severity,
        target: target as NovedadTarget,
        category: category as NovedadCategory,
        operationId,
        ...(target === 'VEHICLE' && resolvedVehicleId && { vehicleId: Number(resolvedVehicleId) }),
        ...(target === 'DRIVER' && resolvedDriverId && { driverId: Number(resolvedDriverId) }),
      });
      onSuccess();
    } catch (err: unknown) {
      setError(
        getUserFriendlyErrorMessage(err, 'Error al registrar la novedad.'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: '1.1rem', marginBottom: '16px' }}>🚨 Reportar Nueva Incidencia</h3>
      
      {error && <div className={styles.errorBanner}>⚠️ {error}</div>}

      {(currentSeverity === 'HIGH' || currentSeverity === 'CRITICAL') && (
        <div className={styles.warningBanner}>
          ⚠️ <strong>Atención:</strong>{' '}
          {currentTarget === 'OPERATION'
            ? 'Las novedades de nivel alto o crítico pausarán la operación.'
            : 'Las novedades de nivel alto o crítico pueden bloquear la disponibilidad del recurso afectado.'}
        </div>
      )}

      <SuperForm
        key={currentTarget}
        fields={formFields}
        defaultValues={{
          target: currentTarget,
          severity: 'MEDIUM',
          category: CATEGORIES_BY_TARGET[currentTarget][0],
          description: '',
        }}
        isLoading={loading}
        submitText="Guardar Novedad"
        cancelText="Volver a Detalles"
        onCancel={onCancel}
        onChange={handleFormChange}
        onSubmit={handleSuperSubmit}
      />
    </div>
  );
}