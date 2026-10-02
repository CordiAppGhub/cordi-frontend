// src/app/(panel)/novedades/components/novedad-form/novedad-form.tsx
'use client';

import React, { useState } from 'react';
import styles from './novedad-modal.module.css'; // Puedes reusar tus estilos
import { novedadesService } from '@/services/novedades.servies';
import { SuperForm } from '@/components/organisms/form/form';
import { FormField } from '@/components/organisms/form/types/form.types';

interface NovedadFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  operationId: number;
  rawOperation?: any; 
}

export function NovedadForm({ onSuccess, onCancel, operationId, rawOperation }: NovedadFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentSeverity, setCurrentSeverity] = useState('MEDIUM');

  const resolvedVehicleId = rawOperation?.vehicleId || rawOperation?.vehicle?.id;
  const resolvedDriverId = rawOperation?.driverId || rawOperation?.driver?.id;


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

  const handleFormChange = (name: string, value: any) => {
    if (name === 'severity') setCurrentSeverity(value as string);
  };

  const handleSuperSubmit = async (formData: Record<string, any>) => {
    const { target, severity, description } = formData;

    if (!description?.trim()) return setError('La descripción es obligatoria.');
    if (target === 'VEHICLE' && !resolvedVehicleId) return setError('Esta operación no tiene vehículo asignado.');
    if (target === 'DRIVER' && !resolvedDriverId) return setError('Esta operación no tiene conductor asignado.');

    setLoading(true);
    setError(null);

    try {
      await novedadesService.create({
        description, severity, target, operationId,
        ...(target === 'VEHICLE' && resolvedVehicleId && { vehicleId: Number(resolvedVehicleId) }),
        ...(target === 'DRIVER' && resolvedDriverId && { driverId: Number(resolvedDriverId) }),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar la novedad.');
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
          ⚠️ <strong>Atención:</strong> Las novedades de nivel Alto o Crítico pondrán automáticamente el recurso afectado en mantenimiento o inactivo.
        </div>
      )}

      <SuperForm
        fields={formFields}
        defaultValues={{ target: 'OPERATION', severity: 'MEDIUM', description: '' }}
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