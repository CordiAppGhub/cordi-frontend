'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { Button } from '@/components/atoms/button/button';
import { Select } from '@/components/atoms/select/select';
import { SuperModal } from '@/components/organisms/modal/modal';
import {
  createDriverExtraReportSchema,
  type CreateDriverExtraReportFormData,
} from '@/schemas/driver-extra-report.schema';
import { useDriverAuth } from '@/providers/authDriverProvider';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';
import { showToast } from '@/utils/alerts';

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
  const {
    extraConcepts,
    getExtraConceptsForOperation,
    loadingExtraConcepts,
    extraConceptsError,
    reportExtra,
    isReportingExtra,
  } = useDriverAuth();
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateDriverExtraReportFormData>({
    resolver: zodResolver(createDriverExtraReportSchema),
    defaultValues: {
      conceptId: '',
      description: '',
    },
  });

  useEffect(() => {
    if (operationId === null) return;
    reset({
      conceptId: '',
      description: '',
    });
  }, [extraConcepts, operationId, reset]);

  const submit = async (values: CreateDriverExtraReportFormData) => {
    if (operationId === null) return;
    const file = values.evidence?.item(0) ?? undefined;
    try {
      await reportExtra(operationId, {
        conceptId: values.conceptId,
        description: values.description,
        ...(file ? { file } : {}),
      });
      reset();
      onSuccess();
    } catch (error) {
      showToast.error(
        getUserFriendlyErrorMessage(error, 'No se pudo enviar el reporte.'),
      );
    }
  };

  const close = () => {
    if (isSubmitting || isReportingExtra) return;
    reset();
    onClose();
  };

  const submitting = isSubmitting || isReportingExtra;
  const conceptsUnavailable =
    !loadingExtraConcepts &&
    !extraConceptsError &&
    extraConcepts.length === 0;
  const operationConcepts =
    operationId === null ? [] : getExtraConceptsForOperation(operationId);
  const noApplicableConcepts =
    !loadingExtraConcepts &&
    !extraConceptsError &&
    extraConcepts.length > 0 &&
    operationConcepts.length === 0;
  const conceptsDisabled =
    loadingExtraConcepts ||
    extraConceptsError ||
    operationConcepts.length === 0;
  const conceptOptions = operationConcepts.map((concept) => ({
    value: concept.code,
    label: concept.name,
  }));

  return (
    <SuperModal
      isOpen={operationId !== null}
      onClose={close}
      title={`Reportar novedad · Operación #${operationId ?? ''}`}
      width="560px"
    >
      <form
        onSubmit={(event) => void handleSubmit(submit)(event)}
        style={{ display: 'grid', gap: 14 }}
      >
        <p style={{ margin: 0, color: '#475569' }}>
          El reporte se enviará al analista para valoración. No se asignará
          ningún monto desde el portal.
        </p>
        <label style={{ display: 'grid', gap: 6 }}>
          Concepto
          <Controller
            control={control}
            name="conceptId"
            render={({ field: { value, onChange } }) => (
              <Select
                id="driver-extra-concept"
                name="conceptId"
                value={value}
                options={conceptOptions}
                onValueChange={onChange}
                searchable
                searchPlaceholder={
                  loadingExtraConcepts
                    ? 'Cargando conceptos…'
                    : 'Buscar concepto de cobro extra…'
                }
                required
                disabled={conceptsDisabled}
                error={errors.conceptId?.message}
              />
            )}
          />
          {conceptsUnavailable && (
            <span role="alert">
              No hay conceptos configurados en Tarifas de Cobro Extra.
            </span>
          )}
          {noApplicableConcepts && (
            <span role="alert">
              No hay conceptos configurados para esta operación.
            </span>
          )}
          {extraConceptsError && (
            <span role="alert">
              No se pudieron cargar los conceptos de Tarifas de Cobro Extra.
              Inténtalo nuevamente más tarde.
            </span>
          )}
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          Observación
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
          Foto de evidencia (opcional)
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
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={submitting}
            disabled={submitting || conceptsDisabled}
          >
            Enviar para valoración
          </Button>
        </div>
      </form>
    </SuperModal>
  );
}
