'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  createOperationIssueSchema,
  type CreateOperationIssueFormData,
} from '@/schemas/operation-issue.schema';
import { operationService } from '@/services/operation.service';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';
import { showToast } from '@/utils/alerts';

interface OperationIssueFormProps {
  operationId: number;
  onCancel: () => void;
  onSuccess: () => void;
}

const issueTypeLabels = {
  MECANICA: 'Falla mecánica',
  VIA: 'Cierre o condición vial',
  CLIENTE: 'Espera o dificultad con el cliente',
  SEGURIDAD: 'Incidente de seguridad',
} as const;

export function OperationIssueForm({
  operationId,
  onCancel,
  onSuccess,
}: OperationIssueFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateOperationIssueFormData>({
    resolver: zodResolver(createOperationIssueSchema),
    defaultValues: { issueType: 'MECANICA', description: '' },
  });

  const submit = async (values: CreateOperationIssueFormData) => {
    try {
      await operationService.reportIssue(operationId, values);
      showToast.success('Novedad operativa registrada.');
      onSuccess();
    } catch (error: unknown) {
      showToast.error(
        getUserFriendlyErrorMessage(error, 'No se pudo registrar la novedad.'),
      );
    }
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(submit)(event)}
      style={{ display: 'grid', gap: 14, padding: 20 }}
    >
      <p style={{ margin: 0, color: '#475569' }}>
        Registra el retraso y su trazabilidad. Esta acción no cambia el estado
        de la operación ni reasigna sus responsables.
      </p>
      <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
        Tipo de novedad
        <select {...register('issueType')}>
          {Object.entries(issueTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
        Descripción
        <textarea
          {...register('description')}
          rows={5}
          maxLength={2000}
          placeholder="Describe el retraso, ubicación, duración estimada y acciones tomadas."
        />
        {errors.description && (
          <span role="alert" style={{ color: '#b91c1c', fontWeight: 400 }}>
            {errors.description.message}
          </span>
        )}
      </label>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : 'Registrar retraso'}
        </button>
      </div>
    </form>
  );
}
