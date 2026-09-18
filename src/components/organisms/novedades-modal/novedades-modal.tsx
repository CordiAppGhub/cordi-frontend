'use client';

import React, { useState } from 'react';
import { Button } from '@/components/atoms/button/button';
import styles from './novedad-modal.module.css';
import { novedadesService } from '@/services/novedades.servies';

interface NovedadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  operationId: number;
  vehicleId?: number | null;
  driverId?: number | null;
  operationTitle?: string;
  // Añadimos por si la operación trae los IDs de forma plana
  rawOperation?: any; 
}

export function NovedadModal({
  isOpen,
  onClose,
  onSuccess,
  operationId,
  vehicleId,
  driverId,
  operationTitle,
  rawOperation,
}: NovedadModalProps) {
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [target, setTarget] = useState<'OPERATION' | 'VEHICLE' | 'DRIVER'>('OPERATION');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // 🔍 Resolución robusta de IDs (soporta tanto props directas como objetos anidados o planas de Prisma)
  const resolvedVehicleId = 
    vehicleId || 
    rawOperation?.vehicleId || 
    rawOperation?.vehicle?.id;

  const resolvedDriverId = 
    driverId || 
    rawOperation?.driverId || 
    rawOperation?.driver?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('La descripción de la novedad es obligatoria.');
      return;
    }

    if (target === 'VEHICLE' && !resolvedVehicleId) {
      setError('Esta operación no tiene un vehículo asignado para reportar una falla mecánica.');
      return;
    }
    if (target === 'DRIVER' && !resolvedDriverId) {
      setError('Esta operación no tiene un conductor asignado para reportar una novedad de personal.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await novedadesService.create({
        description,
        severity,
        target,
        operationId,
        ...(target === 'VEHICLE' && resolvedVehicleId && { vehicleId: Number(resolvedVehicleId) }),
        ...(target === 'DRIVER' && resolvedDriverId && { driverId: Number(resolvedDriverId) }),
      });

      onSuccess();
      onClose();
      setDescription('');
      setSeverity('MEDIUM');
      setTarget('OPERATION');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar la novedad.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            Reportar Novedad {operationTitle ? `— ${operationTitle}` : `(Op #${operationId})`}
          </h2>
          <button onClick={onClose} className={styles.closeBtn}>✕</button>
        </div>

        {error && <div className={styles.errorBanner}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>¿A qué recurso afecta esta incidencia?</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as any)}
              className={styles.select}
            >
              <option value="OPERATION">📦 A la Operación / Viaje en curso</option>
              <option value="VEHICLE">
                🚚 Al Vehículo {resolvedVehicleId ? '(Asignado)' : '(No asignado)'}
              </option>
              <option value="DRIVER">
                👤 Al Conductor {resolvedDriverId ? '(Asignado)' : '(No asignado)'}
              </option>
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Nivel de Severidad / Impacto</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              className={styles.select}
            >
              <option value="LOW">Baja (Observación menor)</option>
              <option value="MEDIUM">Media (Retraso o advertencia)</option>
              <option value="HIGH">Alta (Falla grave / Bloqueo automático)</option>
              <option value="CRITICAL">Crítica (Incidente mayor / Inhabilitación)</option>
            </select>
            {(severity === 'HIGH' || severity === 'CRITICAL') && (
              <span className={styles.warningText}>
                ⚠️ Las novedades de nivel Alto o Crítico pondrán automáticamente el recurso afectado en mantenimiento o inactivo.
              </span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Descripción detallada del problema</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Conductor reporta incapacidad o vehículo con fallo mecánico..."
              className={styles.textarea}
              required
            />
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} disabled={loading} className={styles.cancelBtn}>
              Cancelar
            </button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar Novedad'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}