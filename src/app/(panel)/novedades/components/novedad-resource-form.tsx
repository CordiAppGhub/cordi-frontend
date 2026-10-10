'use client';

import { FormEvent, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { driversService } from '@/services/driver.service';
import { vehiclesService } from '@/services/vehicles.service';
import { novedadesService } from '@/services/novedades.servies';
import { showToast } from '@/utils/alerts';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

export function NovedadResourceForm({ onSuccess, onCancel }: Props) {
  const [target, setTarget] = useState<'DRIVER' | 'VEHICLE'>('DRIVER');
  const [targetId, setTargetId] = useState('');
  const [severity, setSeverity] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const driversQuery = useQuery({
    queryKey: ['drivers'],
    queryFn: driversService.getAll,
    enabled: target === 'DRIVER',
  });
  const vehiclesQuery = useQuery({
    queryKey: ['vehicles'],
    queryFn: vehiclesService.getAll,
    enabled: target === 'VEHICLE',
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!targetId || description.trim().length < 5) return;
    setIsSaving(true);
    try {
      await novedadesService.create({
        description: description.trim(),
        severity,
        target,
        ...(target === 'DRIVER' ? { driverId: Number(targetId) } : { vehicleId: Number(targetId) }),
      });
      showToast.success('Novedad registrada correctamente.');
      onSuccess();
    } catch (error) {
      showToast.error(getUserFriendlyErrorMessage(error, 'No se pudo registrar la novedad.'));
    } finally {
      setIsSaving(false);
    }
  };

  const resourcesLoading = target === 'DRIVER' ? driversQuery.isLoading : vehiclesQuery.isLoading;
  const resourcesError = target === 'DRIVER' ? driversQuery.isError : vehiclesQuery.isError;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <label className="block space-y-1 text-sm font-medium">
        Tipo de novedad
        <select
          value={target}
          onChange={(event) => { setTarget(event.target.value as typeof target); setTargetId(''); }}
          className="w-full rounded border px-3 py-2"
        >
          <option value="DRIVER">Conductor</option>
          <option value="VEHICLE">Vehículo</option>
        </select>
      </label>
      <label className="block space-y-1 text-sm font-medium">
        {target === 'DRIVER' ? 'Conductor afectado' : 'Vehículo afectado'}
        <select
          value={targetId}
          onChange={(event) => setTargetId(event.target.value)}
          disabled={resourcesLoading || resourcesError}
          required
          className="w-full rounded border px-3 py-2"
        >
          <option value="">
            {resourcesLoading ? 'Cargando...' : `Seleccionar ${target === 'DRIVER' ? 'conductor' : 'vehículo'}`}
          </option>
          {target === 'DRIVER'
            ? (driversQuery.data ?? []).map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name || 'Sin nombre'}{driver.cedula ? ` · ${driver.cedula}` : ''}
                </option>
              ))
            : (vehiclesQuery.data ?? []).map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plate} · {vehicle.status}
                </option>
              ))}
        </select>
      </label>
      {resourcesError && (
        <p role="alert" className="text-sm text-red-700">
          No se pudieron cargar los recursos. Vuelve a abrir el formulario para reintentar.
        </p>
      )}
      <label className="block space-y-1 text-sm font-medium">
        Severidad
        <select
          value={severity}
          onChange={(event) => setSeverity(event.target.value)}
          className="w-full rounded border px-3 py-2"
        >
          <option value="LOW">Baja</option>
          <option value="MEDIUM">Media</option>
          <option value="HIGH">Alta</option>
          <option value="CRITICAL">Crítica</option>
        </select>
      </label>
      <label className="block space-y-1 text-sm font-medium">
        Descripción
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          minLength={5}
          required
          rows={4}
          className="w-full rounded border px-3 py-2"
        />
      </label>
      {(severity === 'HIGH' || severity === 'CRITICAL') && (
        <p className="rounded bg-amber-50 p-3 text-sm text-amber-900">
          {target === 'VEHICLE'
            ? 'La severidad alta o crítica bloqueará el vehículo afectado para mantenimiento.'
            : 'La novedad quedará priorizada; el conductor no se desactivará automáticamente.'}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={isSaving} className="rounded border px-4 py-2 text-sm">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSaving || resourcesLoading || resourcesError || !targetId || description.trim().length < 5}
          className="rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isSaving ? 'Guardando...' : 'Registrar novedad'}
        </button>
      </div>
    </form>
  );
}
