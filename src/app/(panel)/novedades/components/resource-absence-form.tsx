'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useAnalysts } from '@/hooks/useAnalysts';
import { driversService } from '@/services/driver.service';
import { resourceAbsenceService } from '@/services/resource-absence.service';
import {
  createResourceAbsenceSchema,
  type CreateResourceAbsenceFormData,
} from '@/schemas/resource-absence.schema';
import { showToast } from '@/utils/alerts';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';

interface ResourceAbsenceFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const reasonLabels = {
  ENFERMEDAD: 'Enfermedad o incapacidad',
  PERMISO: 'Permiso',
  INJUSTIFICADO: 'Ausencia injustificada',
  VACACIONES: 'Vacaciones',
} as const;

export function ResourceAbsenceForm({
  onCancel,
  onSuccess,
}: ResourceAbsenceFormProps) {
  const { analysts, isLoadingAnalysts, error: analystsError } = useAnalysts();
  const driversQuery = useQuery({
    queryKey: ['drivers'],
    queryFn: driversService.getAll,
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateResourceAbsenceFormData>({
    resolver: zodResolver(createResourceAbsenceSchema),
    defaultValues: { reason: 'ENFERMEDAD' },
  });

  const submit = async (values: CreateResourceAbsenceFormData) => {
    try {
      await resourceAbsenceService.createAbsence({
        ...values,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
      });
      showToast.success('Ausencia registrada correctamente.');
      onSuccess();
    } catch (error: unknown) {
      showToast.error(
        getUserFriendlyErrorMessage(error, 'No se pudo registrar la ausencia.'),
      );
    }
  };

  const resourcesError = driversQuery.isError || Boolean(analystsError);
  const isLoadingResources = driversQuery.isLoading || isLoadingAnalysts;

  return (
    <form
      onSubmit={(event) => void handleSubmit(submit)(event)}
      style={{ display: 'grid', gap: 14, padding: 20 }}
    >
      <p style={{ margin: 0, color: '#475569' }}>
        Al registrar la ausencia de un conductor se libera el camión asociado.
      </p>
      <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
        Recurso ausente
        <select
          {...register('userId', { valueAsNumber: true })}
          required
          disabled={isLoadingResources || resourcesError}
        >
          <option value="">
            {isLoadingResources ? 'Cargando recursos…' : 'Seleccionar recurso'}
          </option>
          <optgroup label="Analistas">
            {analysts.map((analyst) => (
              <option key={analyst.id} value={analyst.id}>
                {analyst.name || 'Sin nombre'} · Analista
              </option>
            ))}
          </optgroup>
          <optgroup label="Conductores">
            {(driversQuery.data ?? [])
              .filter((driver) => driver.isActive)
              .map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name || 'Sin nombre'} · Conductor
                </option>
              ))}
          </optgroup>
        </select>
        {errors.userId && (
          <span role="alert" style={{ color: '#b91c1c', fontWeight: 400 }}>
            {errors.userId.message}
          </span>
        )}
        {resourcesError && (
          <span role="alert" style={{ color: '#b91c1c', fontWeight: 400 }}>
            No se pudieron cargar los recursos. Cierra y vuelve a abrir el
            formulario para reintentar.
          </span>
        )}
      </label>
      <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
        Motivo
        <select {...register('reason')}>
          {Object.entries(reasonLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
        Desde
        <input type="datetime-local" {...register('startDate')} required />
        {errors.startDate && (
          <span role="alert" style={{ color: '#b91c1c', fontWeight: 400 }}>
            {errors.startDate.message}
          </span>
        )}
      </label>
      <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
        Hasta
        <input type="datetime-local" {...register('endDate')} required />
        {errors.endDate && (
          <span role="alert" style={{ color: '#b91c1c', fontWeight: 400 }}>
            {errors.endDate.message}
          </span>
        )}
      </label>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isLoadingResources || resourcesError}
        >
          {isSubmitting ? 'Guardando…' : 'Registrar ausencia'}
        </button>
      </div>
    </form>
  );
}
