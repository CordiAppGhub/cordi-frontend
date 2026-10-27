'use client';

import { type FormEvent, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/atoms/button/button';
import { Select } from '@/components/atoms/select/select';
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
import styles from './novedad-resource-form.module.css';

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
    <form onSubmit={handleSubmit} className={styles.form}>
      <label className={styles.field}>
        Tipo de novedad
        <Select
          value={target}
          onChange={(event) => {
            const next = event.target.value as ResourceTarget;
            setTarget(next);
            setTargetId('');
            setCategory(CATEGORIES_BY_TARGET[next][0]);
          }}
        >
          <option value="DRIVER">Conductor</option>
          <option value="VEHICLE">Vehículo</option>
          <option value="ANALYST">Analista</option>
        </Select>
      </label>
      <label className={styles.field}>
        {target === 'DRIVER'
          ? 'Conductor afectado'
          : target === 'VEHICLE'
            ? 'Vehículo afectado'
            : 'Analista afectado'}
        <Select
          value={targetId}
          onChange={(event) => setTargetId(event.target.value)}
          disabled={resourcesLoading || resourcesError}
          required
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
        </Select>
      </label>
      {resourcesError && (
        <p role="alert" className={styles.error}>
          No se pudieron cargar los recursos. Vuelve a abrir el formulario para reintentar.
        </p>
      )}
      <label className={styles.field}>
        Motivo
        <Select
          value={category}
          onChange={(event) => setCategory(event.target.value as NovedadCategory)}
        >
          {CATEGORIES_BY_TARGET[target].map((item) => (
            <option key={item} value={item}>
              {NOVEDAD_CATEGORY_LABELS[item]}
            </option>
          ))}
        </Select>
      </label>
      <label className={styles.field}>
        Fecha estimada de retorno (opcional)
        <input
          type="datetime-local"
          value={expectedReturnAt}
          onChange={(event) => setExpectedReturnAt(event.target.value)}
          className={styles.input}
        />
      </label>
      <label className={styles.field}>
        Severidad
        <Select
          value={severity}
          onChange={(event) => setSeverity(event.target.value)}
        >
          <option value="LOW">Baja</option>
          <option value="MEDIUM">Media</option>
          <option value="HIGH">Alta</option>
          <option value="CRITICAL">Crítica</option>
        </Select>
      </label>
      <label className={styles.field}>
        Descripción
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          minLength={20}
          required
          rows={4}
          className={styles.textarea}
          placeholder="Describe qué ocurrió, desde cuándo, impacto en el servicio y acciones requeridas."
        />
      </label>
      {(severity === 'HIGH' || severity === 'CRITICAL' || blocksAvailability) && (
        <p className={styles.warning}>
          {target === 'ANALYST'
            ? 'La novedad quedará registrada para seguimiento y no bloqueará asignaciones. Si se requiere cobertura parcial, se podrá crear desde esta novedad.'
            : target === 'VEHICLE'
            ? 'El vehículo pasará a mantenimiento y su conductor quedará libre para reasignarse a otro vehículo disponible.'
            : 'El conductor quedará NO disponible y se liberará de su vehículo, que podrá asignarse a otro conductor disponible.'}
        </p>
      )}
      {target === 'ANALYST' && severity !== 'HIGH' && severity !== 'CRITICAL' && (
        <p className={styles.info}>
          La novedad quedará registrada para seguimiento. No bloquea las
          asignaciones al analista. La cobertura parcial se gestiona desde la
          novedad registrada.
        </p>
      )}
      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSaving || resourcesLoading || resourcesError || !targetId || description.trim().length < 20}
          isLoading={isSaving}
        >
          {isSaving ? 'Guardando...' : 'Registrar novedad'}
        </Button>
      </div>
    </form>
  );
}
