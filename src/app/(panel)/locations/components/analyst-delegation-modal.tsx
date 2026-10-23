'use client';

import { FormEvent, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SuperModal } from '@/components/organisms/modal/modal';
import { useAnalysts } from '@/hooks/useAnalysts';
import { useClients } from '@/hooks/useClient';
import { assignmentService } from '@/services/assignmentAnlystClient.service';
import { CreateDelegationInput } from '@/types/assignmentAnlist';

interface AnalystDelegationModalProps {
  onClose: () => void;
  onCreate: (data: CreateDelegationInput) => Promise<boolean>;
  isSaving: boolean;
}

export function AnalystDelegationModal({
  onClose,
  onCreate,
  isSaving,
}: AnalystDelegationModalProps) {
  const { clients, isLoadingClients } = useClients();
  const { analysts, isLoadingAnalysts } = useAnalysts();
  const [clientId, setClientId] = useState('');
  const [analystId, setAnalystId] = useState('');
  const [locationIds, setLocationIds] = useState<number[]>([]);
  const [operationIds, setOperationIds] = useState<number[]>([]);
  const [reason, setReason] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const resourcesQuery = useQuery({
    queryKey: ['analyst-delegation-resources', clientId],
    queryFn: () => assignmentService.getDelegationResources(Number(clientId)),
    enabled: Boolean(clientId),
  });

  const toggleId = (
    id: number,
    selected: number[],
    setSelected: (value: number[]) => void,
  ) => {
    setSelected(
      selected.includes(id)
        ? selected.filter((selectedId) => selectedId !== id)
        : [...selected, id],
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    if (!clientId || !analystId) {
      setFormError('Selecciona el cliente y el analista que cubrirá.');
      return;
    }
    if (locationIds.length === 0 && operationIds.length === 0) {
      setFormError('Selecciona al menos una ubicación o una operación.');
      return;
    }
    if (reason.trim().length < 10) {
      setFormError('Explica el motivo de la cobertura (mínimo 10 caracteres).');
      return;
    }

    const payload: CreateDelegationInput = {
      clientId: Number(clientId),
      analystId: Number(analystId),
      reason: reason.trim(),
      ...(locationIds.length ? { locationIds } : {}),
      ...(operationIds.length ? { operationIds } : {}),
      ...(endsAt ? { endsAt: new Date(endsAt).toISOString() } : {}),
    };
    if (await onCreate(payload)) onClose();
  };

  return (
    <SuperModal
      isOpen
      onClose={onClose}
      title="Delegar cobertura parcial"
      width="720px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
        <p style={{ margin: 0, color: '#475569' }}>
          El analista titular se conserva. Puedes delegar ubicaciones, operaciones
          específicas o ambas.
        </p>
        <label style={{ display: 'grid', gap: 6 }}>
          Cliente
          <select
            required
            value={clientId}
            disabled={isLoadingClients}
            onChange={(event) => {
              setClientId(event.target.value);
              setLocationIds([]);
              setOperationIds([]);
            }}
            style={inputStyle}
          >
            <option value="">Seleccionar cliente</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.razonSocial} ({client.nit})
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          Analista de cobertura
          <select
            required
            value={analystId}
            disabled={isLoadingAnalysts}
            onChange={(event) => {
              setAnalystId(event.target.value);
              setLocationIds([]);
              setOperationIds([]);
            }}
            style={inputStyle}
          >
            <option value="">Seleccionar analista</option>
            {analysts.map((analyst) => (
              <option key={analyst.id} value={analyst.id}>
                {analyst.name}
              </option>
            ))}
          </select>
        </label>

        {clientId && resourcesQuery.isLoading && (
          <p role="status">Cargando ubicaciones y operaciones...</p>
        )}
        {clientId && resourcesQuery.isError && (
          <div role="alert" style={{ color: '#b91c1c' }}>
            No se pudieron cargar los recursos del cliente.{' '}
            <button type="button" onClick={() => void resourcesQuery.refetch()}>
              Reintentar
            </button>
          </div>
        )}
        {resourcesQuery.data && (
          <>
            <fieldset style={fieldsetStyle}>
              <legend>Ubicaciones que cubrirá</legend>
              {resourcesQuery.data.locations.length === 0 ? (
                <p>No hay ubicaciones asociadas a este cliente.</p>
              ) : (
                resourcesQuery.data.locations.map((location) => (
                  <label key={location.id} style={choiceStyle}>
                    <input
                      type="checkbox"
                      checked={locationIds.includes(location.id)}
                      disabled={
                        !location.principalAnalyst ||
                        location.principalAnalyst.id === Number(analystId)
                      }
                      onChange={() =>
                        toggleId(location.id, locationIds, setLocationIds)
                      }
                    />
                    <span>
                      {location.location.name}
                      <small style={{ display: 'block', color: '#64748b' }}>
                        Titular: {location.principalAnalyst?.name ?? 'Sin asignar'}
                      </small>
                    </span>
                  </label>
                ))
              )}
            </fieldset>

            <fieldset style={fieldsetStyle}>
              <legend>Operaciones específicas que cubrirá</legend>
              {resourcesQuery.data.operations.length === 0 ? (
                <p>No hay operaciones activas para delegar.</p>
              ) : (
                resourcesQuery.data.operations.map((operation) => (
                  <label key={operation.id} style={choiceStyle}>
                    <input
                      type="checkbox"
                      checked={operationIds.includes(operation.id)}
                      disabled={
                        !operation.analyst ||
                        operation.analyst.id === Number(analystId)
                      }
                      onChange={() =>
                        toggleId(operation.id, operationIds, setOperationIds)
                      }
                    />
                    <span>
                      Operación #{operation.id} · {operation.type} ·{' '}
                      {operation.status}
                      {operation.numeroPedido
                        ? ` · Pedido ${operation.numeroPedido}`
                        : ''}
                      <small style={{ display: 'block', color: '#64748b' }}>
                        Titular: {operation.analyst?.name ?? 'Sin asignar'}
                      </small>
                    </span>
                  </label>
                ))
              )}
            </fieldset>
          </>
        )}

        <label style={{ display: 'grid', gap: 6 }}>
          Motivo de la cobertura
          <textarea
            required
            minLength={10}
            maxLength={500}
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            style={inputStyle}
            placeholder="Ej. Ausencia médica del analista titular..."
          />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          Fecha prevista de finalización (opcional)
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
            style={inputStyle}
          />
          <small style={{ color: '#64748b' }}>
            Es una fecha de referencia; la cobertura debe finalizarse manualmente.
          </small>
        </label>
        {formError && (
          <p role="alert" style={{ margin: 0, color: '#b91c1c' }}>
            {formError}
          </p>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} disabled={isSaving}>
            Cancelar
          </button>
          <button
            type="submit"
            disabled={
              isSaving ||
              resourcesQuery.isLoading ||
              resourcesQuery.isError ||
              !clientId ||
              !analystId
            }
          >
            {isSaving ? 'Guardando...' : 'Crear cobertura'}
          </button>
        </div>
      </form>
    </SuperModal>
  );
}

const inputStyle = {
  boxSizing: 'border-box' as const,
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
};

const fieldsetStyle = {
  display: 'grid',
  gap: 8,
  maxHeight: 180,
  overflowY: 'auto' as const,
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  padding: 12,
};

const choiceStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
};
