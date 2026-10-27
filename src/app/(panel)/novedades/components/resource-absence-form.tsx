'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/atoms/button/button';
import { Select } from '@/components/atoms/select/select';
import { useAnalysts } from '@/hooks/useAnalysts';
import { driversService } from '@/services/driver.service';
import { resourceAbsenceService } from '@/services/resource-absence.service';
import {
  createResourceAbsenceSchema,
  type CreateResourceAbsenceFormData,
} from '@/schemas/resource-absence.schema';
import { showToast } from '@/utils/alerts';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';
import styles from './resource-absence-form.module.css';

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
    control,
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
      className={styles.form}
    >
      <p className={styles.description}>
        Si el recurso es un conductor, se libera el camión asociado. El periodo
        también permite restaurar las asignaciones temporales al cerrar la ausencia.
      </p>
      <label className={styles.field}>
        Recurso ausente
        <Controller
          name="userId"
          control={control}
          render={({ field }) => (
            <Select
              name={field.name}
              value={field.value || ''}
              onBlur={field.onBlur}
              onChange={(event) =>
                field.onChange(Number(event.target.value))
              }
              required
              disabled={isLoadingResources || resourcesError}
            >
              <option value="">
                {isLoadingResources
                  ? 'Cargando recursos…'
                  : 'Seleccionar recurso'}
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
            </Select>
          )}
        />
        {errors.userId && (
          <span role="alert" className={styles.error}>
            {errors.userId.message}
          </span>
        )}
        {resourcesError && (
          <span role="alert" className={styles.error}>
            No se pudieron cargar los recursos. Cierra y vuelve a abrir el
            formulario para reintentar.
          </span>
        )}
      </label>
      <label className={styles.field}>
        Motivo
        <Controller
          name="reason"
          control={control}
          render={({ field }) => (
            <Select
              name={field.name}
              value={field.value}
              onBlur={field.onBlur}
              onChange={(event) => field.onChange(event.target.value)}
            >
              {Object.entries(reasonLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          )}
        />
      </label>
      <label className={styles.field}>
        Desde
        <input type="datetime-local" {...register('startDate')} required className={styles.input} />
        {errors.startDate && (
          <span role="alert" className={styles.error}>
            {errors.startDate.message}
          </span>
        )}
      </label>
      <label className={styles.field}>
        Hasta
        <input type="datetime-local" {...register('endDate')} required className={styles.input} />
        {errors.endDate && (
          <span role="alert" className={styles.error}>
            {errors.endDate.message}
          </span>
        )}
      </label>
      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || isLoadingResources || resourcesError}
        isLoading={isSubmitting}
        >
        {isSubmitting ? 'Guardando…' : 'Registrar ausencia'}
        </Button>
      </div>
    </form>
  );
}
