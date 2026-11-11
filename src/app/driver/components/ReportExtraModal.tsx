'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/atoms/button/button';
import { SuperModal } from '@/components/organisms/modal/modal';
import {
  createDriverExtraReportSchema,
  type CreateDriverExtraReportFormData,
} from '@/schemas/driver-extra-report.schema';
import { driverPortalService } from '@/services/driverPortal.service';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';
import { showToast } from '@/utils/alerts';

const reportTypeLabels = {
  STAND_BY: 'Stand by / tiempo de espera',
  DESVIO: 'Desvío operativo',
  MANIOBRA_EXTRA: 'Maniobra extra',
  EN_PISO: 'Contenedor bajado a piso',
} as const;

interface ReportExtraModalProps {
  operationId: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReportExtraModal({
  operationId,
  onClose,
  onSuccess,
}: ReportExtraModalProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateDriverExtraReportFormData>({
    resolver: zodResolver(createDriverExtraReportSchema),
    defaultValues: {
      type: 'STAND_BY',
      durationHours: '',
      description: '',
    },
  });

  const submit = async (values: CreateDriverExtraReportFormData) => {
    if (!operationId) return;
    const file = values.evidence.item(0);
    if (!file) return;

    try {
      await driverPortalService.reportExtraReport(operationId, {
        type: values.type,
        ...(values.durationHours
          ? { durationHours: Number(values.durationHours) }
          : {}),
        description: values.description,
        file,
      });
      await queryClient.invalidateQueries({ queryKey: ['driver-portal'] });
      showToast.success('Reporte enviado para revisión del analista.');
      reset();
      onSuccess();
    } catch (error) {
      showToast.error(
        getUserFriendlyErrorMessage(error, 'No se pudo enviar el reporte.'),
      );
    }
  };

  const close = () => {
    reset();
    onClose();
  };

  return (
    <SuperModal
      isOpen={operationId !== null}
      onClose={close}
      title={`Reportar cobro extra · Operación #${operationId ?? ''}`}
      width="560px"
    >
      <form
        onSubmit={(event) => void handleSubmit(submit)(event)}
        style={{ display: 'grid', gap: 14 }}
      >
        <p style={{ margin: 0, color: '#475569' }}>
          Reporta el hecho y adjunta evidencia. El analista revisará y definirá
          el concepto y los valores a cobrar.
        </p>
        <label style={{ display: 'grid', gap: 6 }}>
          Tipo de evento
          <select {...register('type')}>
            {Object.entries(reportTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.type && (
            <span role="alert">{errors.type.message}</span>
          )}
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          Duración en horas (opcional)
          <input
            type="number"
            min="0.1"
            max="168"
            step="0.1"
            inputMode="decimal"
            {...register('durationHours')}
          />
          {errors.durationHours && (
            <span role="alert">{errors.durationHours.message}</span>
          )}
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          Descripción
          <textarea
            rows={4}
            maxLength={2000}
            placeholder="Describe qué ocurrió, dónde y cuándo."
            {...register('description')}
          />
          {errors.description && (
            <span role="alert">{errors.description.message}</span>
          )}
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          Foto de evidencia
          <input
            type="file"
            accept="image/*"
            capture="environment"
            {...register('evidence')}
          />
          {errors.evidence && (
            <span role="alert">{errors.evidence.message}</span>
          )}
        </label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button
            type="button"
            variant="secondary"
            onClick={close}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
            Enviar reporte
          </Button>
        </div>
      </form>
    </SuperModal>
  );
}
