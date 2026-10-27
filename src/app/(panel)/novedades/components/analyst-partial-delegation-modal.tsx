'use client';

import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SuperModal } from '@/components/organisms/modal/modal';
import { Button } from '@/components/atoms/button/button';
import { Select } from '@/components/atoms/select/select';
import { assignmentService } from '@/services/assignmentAnlystClient.service';
import { resourceAbsenceService } from '@/services/resource-absence.service';
import type { NovedadItem } from '@/services/novedades.servies';
import type { CreateDelegationInput } from '@/types/assignmentAnlist';
import { showToast } from '@/utils/alerts';
import styles from './analyst-partial-delegation-modal.module.css';

interface AnalystPartialDelegationModalProps {
  isOpen: boolean;
  novedad: NovedadItem;
  isSaving: boolean;
  onClose: () => void;
  onCreate: (data: CreateDelegationInput) => Promise<boolean>;
}

export function AnalystPartialDelegationModal({
  isOpen,
  novedad,
  isSaving,
  onClose,
  onCreate,
}: AnalystPartialDelegationModalProps) {
  const [clientId, setClientId] = useState('');
  const [delegateAnalystId, setDelegateAnalystId] = useState('');
  const [locationIds, setLocationIds] = useState<number[]>([]);
  const [operationIds, setOperationIds] = useState<number[]>([]);
  const [endsAt, setEndsAt] = useState(() => {
    const expectedReturnAt = novedad.expectedReturnAt
      ? new Date(novedad.expectedReturnAt)
      : null;
    return expectedReturnAt && expectedReturnAt > new Date()
      ? toDateTimeInput(expectedReturnAt)
      : '';
  });
  const [reason, setReason] = useState(
    `Cobertura por novedad #${novedad.id}: ${novedad.description}`.slice(0, 500),
  );
  const analystId = novedad.analyst?.id;

  const clientsQuery = useQuery({
    queryKey: ['partial-delegation-clients', analystId],
    queryFn: () => {
      if (analystId === undefined) {
        throw new Error('La novedad no tiene un analista asociado.');
      }
      return resourceAbsenceService.getAnalystClients(analystId);
    },
    enabled: isOpen && analystId !== undefined,
  });
  const analystsQuery = useQuery({
    queryKey: ['partial-delegation-analysts', analystId],
    queryFn: () => {
      if (analystId === undefined) {
        throw new Error('La novedad no tiene un analista asociado.');
      }
      return resourceAbsenceService.getAnalysts(analystId);
    },
    enabled: isOpen && analystId !== undefined,
  });
  const resourcesQuery = useQuery({
    queryKey: ['partial-delegation-resources', clientId],
    queryFn: () => assignmentService.getDelegationResources(Number(clientId)),
    enabled: isOpen && clientId !== '',
  });

  const eligibleLocations =
    resourcesQuery.data?.locations.filter(
      (location) => location.principalAnalyst?.id === analystId,
    ) ?? [];
  const eligibleOperations =
    resourcesQuery.data?.operations.filter(
      (operation) => operation.analyst?.id === analystId,
    ) ?? [];

  const toggleSelection = (
    current: number[],
    value: number,
    checked: boolean,
  ) =>
    checked
      ? [...current, value]
      : current.filter((selectedId) => selectedId !== value);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!analystId || !clientId || !delegateAnalystId) {
      showToast.error('Selecciona el cliente y el analista de cobertura.');
      return;
    }
    if (locationIds.length === 0 && operationIds.length === 0) {
      showToast.error('Selecciona al menos una ubicación o una operación.');
      return;
    }
    if (reason.trim().length < 10) {
      showToast.error('Describe el motivo de la cobertura (mínimo 10 caracteres).');
      return;
    }

    const success = await onCreate({
      novedadId: novedad.id,
      clientId: Number(clientId),
      analystId: Number(delegateAnalystId),
      locationIds,
      operationIds,
      reason: reason.trim(),
      ...(endsAt ? { endsAt: new Date(endsAt).toISOString() } : {}),
    });
    if (success) onClose();
  };

  return (
    <SuperModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Cobertura parcial · Novedad #${novedad.id}`}
      width="640px"
    >
      <form onSubmit={(event) => void submit(event)} className={styles.form}>
        <p className={styles.description}>
          Analista ausente: <strong>{novedad.analyst?.name ?? 'Sin nombre'}</strong>.
          Esta cobertura quedará vinculada a esta novedad y se finalizará al
          resolverla.
        </p>

        <label className={styles.field}>
          Cliente
          <Select
            value={clientId}
            onChange={(event) => {
              setClientId(event.target.value);
              setLocationIds([]);
              setOperationIds([]);
            }}
            disabled={clientsQuery.isLoading || clientsQuery.isError}
            required
          >
            <option value="">Seleccionar cliente</option>
            {(clientsQuery.data ?? []).map((client) => (
              <option key={client.id} value={client.id}>
                {client.razonSocial}
              </option>
            ))}
          </Select>
          {clientsQuery.isError && (
            <span role="alert" className={styles.error}>
              No se pudo cargar la cartera del analista.
            </span>
          )}
        </label>

        <label className={styles.field}>
          Analista de cobertura
          <Select
            value={delegateAnalystId}
            onChange={(event) => setDelegateAnalystId(event.target.value)}
            disabled={analystsQuery.isLoading || analystsQuery.isError}
            required
          >
            <option value="">Seleccionar analista</option>
            {(analystsQuery.data ?? []).map((analyst) => (
              <option key={analyst.id} value={analyst.id}>
                {analyst.name || 'Sin nombre'}
                {analyst.email ? ` · ${analyst.email}` : ''}
              </option>
            ))}
          </Select>
          {analystsQuery.isError && (
            <span role="alert" className={styles.error}>
              No se pudieron cargar los analistas disponibles.
            </span>
          )}
        </label>

        {clientId && (
          <fieldset className={styles.scope}>
            <legend className={styles.legend}>Alcance</legend>
            {resourcesQuery.isLoading ? (
              <p>Cargando ubicaciones y operaciones…</p>
            ) : resourcesQuery.isError ? (
              <p role="alert" className={styles.error}>
                No se pudo cargar el alcance de este cliente.
              </p>
            ) : eligibleLocations.length === 0 &&
              eligibleOperations.length === 0 ? (
              <p>
                No hay ubicaciones ni operaciones activas de este cliente
                asignadas al analista de la novedad.
              </p>
            ) : (
              <>
                {eligibleLocations.map((location) => (
                  <label key={`location-${location.id}`} className={styles.choice}>
                    <input
                      type="checkbox"
                      checked={locationIds.includes(location.id)}
                      onChange={(event) =>
                        setLocationIds((current) =>
                          toggleSelection(
                            current,
                            location.id,
                            event.target.checked,
                          ),
                        )
                      }
                    />
                    Ubicación: {location.location.name}
                  </label>
                ))}
                {eligibleOperations.map((operation) => (
                  <label key={`operation-${operation.id}`} className={styles.choice}>
                    <input
                      type="checkbox"
                      checked={operationIds.includes(operation.id)}
                      onChange={(event) =>
                        setOperationIds((current) =>
                          toggleSelection(
                            current,
                            operation.id,
                            event.target.checked,
                          ),
                        )
                      }
                    />
                    Operación #{operation.id}
                    {operation.numeroPedido ? ` · ${operation.numeroPedido}` : ''}
                    {operation.type ? ` · ${operation.type}` : ''}
                  </label>
                ))}
              </>
            )}
          </fieldset>
        )}

        <label className={styles.field}>
          Motivo de la cobertura
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={500}
            minLength={10}
            required
            rows={3}
            className={styles.textInput}
          />
        </label>

        <label className={styles.field}>
          Fin previsto (opcional)
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
            className={styles.textInput}
          />
        </label>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={
              isSaving ||
              clientsQuery.isLoading ||
              analystsQuery.isLoading ||
              resourcesQuery.isLoading
            }
          >
            {isSaving ? 'Delegando…' : 'Asignar cobertura'}
          </Button>
        </div>
      </form>
    </SuperModal>
  );
}

function toDateTimeInput(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}
