'use client';

import { FormEvent, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { driversService } from '@/services/driver.service';
import { vehiclesService } from '@/services/vehicles.service';
import { useAnalysts } from '@/hooks/useAnalysts';
import {
  novedadesService,
  CATEGORIES_BY_TARGET,
  BLOCKING_CATEGORIES,
  NOVEDAD_CATEGORY_LABELS,
  type NovedadCategory,
} from '@/services/novedades.servies';
import { showToast } from '@/utils/alerts';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

type ResourceTarget = 'DRIVER' | 'VEHICLE' | 'ANALYST';

export function NovedadResourceForm({ onSuccess, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<ResourceTarget>('DRIVER');
  const [targetId, setTargetId] = useState('');
  const [severity, setSeverity] = useState('MEDIUM');
  const [category, setCategory] = useState<NovedadCategory>('ENFERMEDAD');
  const [expectedReturnAt, setExpectedReturnAt] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const driversQuery = useQuery({
    queryKey: ['drivers'],
    queryFn: driversService.getAll,
    enabled: target === 'DRIVER',
  });
  const { analysts, isLoadingAnalysts, error: analystsError } = useAnalysts(
    target === 'ANALYST',
  );
  const vehiclesQuery = useQuery({
    queryKey: ['vehicles'],
    queryFn: vehiclesService.getAll,
    enabled: target === 'VEHICLE',
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!targetId || description.trim().length < 20) return;
    setIsSaving(true);
    try {
      await novedadesService.create({
        description: description.trim(),
        severity,
        target,
        category,
        ...(expectedReturnAt ? { expectedReturnAt: new Date(expectedReturnAt).toISOString() } : {}),
        ...(target === 'DRIVER' ? { driverId: Number(targetId) } : {}),
        ...(target === 'VEHICLE' ? { vehicleId: Number(targetId) } : {}),
        ...(target === 'ANALYST' ? { analystId: Number(targetId) } : {}),
      });
      await queryClient.invalidateQueries({
        queryKey: ['dashboard', 'operation-alerts'],
      });
      showToast.success('Novedad registrada correctamente.');
      onSuccess();
    } catch (error) {
      showToast.error(getUserFriendlyErrorMessage(error, 'No se pudo registrar la novedad.'));
    } finally {
      setIsSaving(false);
    }
  };

  const resourcesLoading =
    target === 'DRIVER'
      ? driversQuery.isLoading
      : target === 'VEHICLE'
        ? vehiclesQuery.isLoading
        : isLoadingAnalysts;
  const resourcesError =
    target === 'DRIVER'
      ? driversQuery.isError
      : target === 'VEHICLE'
        ? vehiclesQuery.isError
        : Boolean(analystsError);
  const blocksAvailability =
    (target === 'DRIVER' || target === 'VEHICLE') &&
    BLOCKING_CATEGORIES[target].includes(category);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <label className="block space-y-1 text-sm font-medium">
        Tipo de novedad
        <select
          value={target}
          onChange={(event) => {
            const next = event.target.value as ResourceTarget;
            setTarget(next);
            setTargetId('');
            setCategory(CATEGORIES_BY_TARGET[next][0]);
          }}
          className="w-full rounded border px-3 py-2"
        >
          <option value="DRIVER">Conductor</option>
          <option value="VEHICLE">Vehículo</option>
          <option value="ANALYST">Analista</option>
        </select>
      </label>
      <label className="block space-y-1 text-sm font-medium">
        {target === 'DRIVER'
          ? 'Conductor afectado'
          : target === 'VEHICLE'
            ? 'Vehículo afectado'
            : 'Analista afectado'}
        <select
          value={targetId}
          onChange={(event) => setTargetId(event.target.value)}
          disabled={resourcesLoading || resourcesError}
          required
          className="w-full rounded border px-3 py-2"
        >
          <option value="">
            {resourcesLoading
              ? 'Cargando...'
              : `Seleccionar ${
                  target === 'DRIVER'
                    ? 'conductor'
                    : target === 'VEHICLE'
                      ? 'vehículo'
                      : 'analista'
                }`}
          </option>
          {target === 'DRIVER'
            ? (driversQuery.data ?? []).map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name || 'Sin nombre'}{driver.cedula ? ` · ${driver.cedula}` : ''}
                </option>
              ))
            : target === 'VEHICLE'
              ? (vehiclesQuery.data ?? []).map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plate} · {vehicle.status}
                </option>
              ))
              : analysts.map((analyst) => (
                <option key={analyst.id} value={analyst.id}>
                  {analyst.name} · {analyst.email}
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
        Motivo
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as NovedadCategory)}
          className="w-full rounded border px-3 py-2"
        >
          {CATEGORIES_BY_TARGET[target].map((item) => (
            <option key={item} value={item}>
              {NOVEDAD_CATEGORY_LABELS[item]}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm font-medium">
        Fecha estimada de retorno (opcional)
        <input
          type="datetime-local"
          value={expectedReturnAt}
          onChange={(event) => setExpectedReturnAt(event.target.value)}
          className="w-full rounded border px-3 py-2"
        />
      </label>
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
          minLength={20}
          required
          rows={4}
          className="w-full rounded border px-3 py-2"
          placeholder="Describe qué ocurrió, desde cuándo, impacto en el servicio y acciones requeridas."
        />
      </label>
      {(severity === 'HIGH' || severity === 'CRITICAL' || blocksAvailability) && (
        <p className="rounded bg-amber-50 p-3 text-sm text-amber-900">
          {target === 'ANALYST'
            ? 'La novedad quedará registrada para seguimiento. No bloquea asignaciones al analista; la cobertura debe gestionarse desde Asignación de Clientes.'
            : target === 'VEHICLE'
            ? 'El vehículo pasará a mantenimiento y su conductor quedará libre para reasignarse a otro vehículo disponible.'
            : 'El conductor quedará NO disponible y se liberará de su vehículo, que podrá asignarse a otro conductor disponible.'}
        </p>
      )}
      {target === 'ANALYST' && severity !== 'HIGH' && severity !== 'CRITICAL' && (
        <p className="rounded bg-blue-50 p-3 text-sm text-blue-900">
          La novedad quedará registrada para seguimiento. No bloquea las
          asignaciones al analista.
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={isSaving} className="rounded border px-4 py-2 text-sm">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSaving || resourcesLoading || resourcesError || !targetId || description.trim().length < 20}
          className="rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isSaving ? 'Guardando...' : 'Registrar novedad'}
        </button>
      </div>
    </form>
  );
}
