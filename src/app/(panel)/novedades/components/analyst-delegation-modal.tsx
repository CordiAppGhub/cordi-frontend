'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { SuperModal } from '@/components/organisms/modal/modal';
import {
  analystDelegationSchema,
  type AnalystDelegationFormData,
} from '@/schemas/resource-absence.schema';
import {
  resourceAbsenceService,
  type ResourceAbsence,
} from '@/services/resource-absence.service';
import { showToast } from '@/utils/alerts';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';

interface AnalystDelegationModalProps {
  isOpen: boolean;
  absence: ResourceAbsence;
  onClose: () => void;
  onSuccess: () => void;
}

export function AnalystDelegationModal({
  isOpen,
  absence,
  onClose,
  onSuccess,
}: AnalystDelegationModalProps) {
  const queryClient = useQueryClient();
  const clientsQuery = useQuery({
    queryKey: ['absence-analyst-clients', absence.userId],
    queryFn: () => resourceAbsenceService.getAnalystClients(absence.userId),
    enabled: isOpen,
  });
  const analystsQuery = useQuery({
    queryKey: ['absence-target-analysts', absence.userId],
    queryFn: () => resourceAbsenceService.getAnalysts(absence.userId),
    enabled: isOpen,
  });
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AnalystDelegationFormData>({
    resolver: zodResolver(analystDelegationSchema),
    defaultValues: { clientIds: [], targetAnalystId: 0 },
  });

  const submit = async (values: AnalystDelegationFormData) => {
    try {
      await resourceAbsenceService.delegateAnalyst({
        absentAnalystId: absence.userId,
        clientIds: values.clientIds,
        targetAnalystId: values.targetAnalystId,
      });
      showToast.success('Clientes delegados temporalmente.');
      await queryClient.invalidateQueries({ queryKey: ['resource-absences'] });
      onSuccess();
    } catch (error: unknown) {
      showToast.error(
        getUserFriendlyErrorMessage(error, 'No se pudo delegar el portafolio.'),
      );
    }
  };

  return (
    <SuperModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Delegar clientes · ${absence.user.name || 'Analista'}`}
      width="620px"
    >
      <form
        onSubmit={(event) => void handleSubmit(submit)(event)}
        style={{ display: 'grid', gap: 14, padding: 20 }}
      >
        <fieldset style={{ display: 'grid', gap: 8, border: 0, padding: 0 }}>
          <legend style={{ fontWeight: 700, marginBottom: 8 }}>
            Clientes que se delegarán
          </legend>
          {clientsQuery.isLoading ? (
            <p>Cargando cartera…</p>
          ) : clientsQuery.isError ? (
            <p role="alert">No se pudo cargar la cartera del analista.</p>
          ) : clientsQuery.data?.length ? (
            <Controller
              name="clientIds"
              control={control}
              render={({ field }) => (
                <div style={{ display: 'grid', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                  {clientsQuery.data?.map((client) => (
                    <label
                      key={client.id}
                      style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                    >
                      <input
                        type="checkbox"
                        checked={field.value.includes(client.id)}
                        onChange={(event) => {
                          const next = event.target.checked
                            ? [...field.value, client.id]
                            : field.value.filter((id) => id !== client.id);
                          field.onChange(next);
                        }}
                      />
                      {client.razonSocial}
                    </label>
                  ))}
                </div>
              )}
            />
          ) : (
            <p>El analista no tiene clientes asignados.</p>
          )}
          {errors.clientIds && (
            <span role="alert" style={{ color: '#b91c1c' }}>
              {errors.clientIds.message}
            </span>
          )}
        </fieldset>
        <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
          Analista sustituto
          <select
            {...register('targetAnalystId', { valueAsNumber: true })}
            required
            disabled={analystsQuery.isLoading || analystsQuery.isError}
          >
            <option value="">Seleccionar analista</option>
            {(analystsQuery.data ?? []).map((analyst) => (
              <option key={analyst.id} value={analyst.id}>
                {analyst.name || 'Sin nombre'}{analyst.email ? ` · ${analyst.email}` : ''}
              </option>
            ))}
          </select>
          {errors.targetAnalystId && (
            <span role="alert" style={{ color: '#b91c1c' }}>
              {errors.targetAnalystId.message}
            </span>
          )}
          {analystsQuery.isError && (
            <span role="alert" style={{ color: '#b91c1c' }}>
              No se pudieron cargar los analistas disponibles.
            </span>
          )}
        </label>
        <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
          La delegación vence al finalizar la ausencia y no modifica al analista
          titular de los clientes.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </button>
          <button
            type="submit"
            disabled={
              isSubmitting ||
              clientsQuery.isLoading ||
              clientsQuery.isError ||
              !clientsQuery.data?.length ||
              analystsQuery.isLoading ||
              analystsQuery.isError
            }
          >
            {isSubmitting ? 'Delegando…' : 'Delegar clientes'}
          </button>
        </div>
      </form>
    </SuperModal>
  );
}
