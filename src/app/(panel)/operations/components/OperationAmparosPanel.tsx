'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Loader2,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { driversService } from '@/services/driver.service';
import { operationService, AmparoSuggestion } from '@/services/operation.service';
import { vehiclesService } from '@/services/vehicles.service';
import { useAuthStore } from '@/store/use-auth.store';
import { showToast } from '@/utils/alerts';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';
import { SuperModal } from '@/components/organisms/modal/modal';
import styles from './OperationAmparosPanel.module.css';

interface Props {
  enabled: boolean;
}

const formatAppointment = (date: string) =>
  new Date(date).toLocaleString('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

const getCounterpartAnalystName = (suggestion: AmparoSuggestion, userId: number) => {
  const { exportOperation, importOperation } = suggestion;
  const isExportOwner = exportOperation.analyst?.id === userId;
  const isImportOwner = importOperation.analyst?.id === userId;

  if (isExportOwner && !isImportOwner) {
    return importOperation.analyst?.name || 'responsable de importación';
  }
  if (isImportOwner && !isExportOwner) {
    return exportOperation.analyst?.name || 'responsable de exportación';
  }
  return 'responsable de la otra operación';
};

export function OperationAmparosPanel({ enabled }: Props) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const canConfirmAmparo = user?.role === 'ADMIN' || user?.role === 'ANALISTA';
  const [selected, setSelected] = useState<AmparoSuggestion | null>(null);
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [agreementConfirmed, setAgreementConfirmed] = useState(false);

  const suggestionsQuery = useQuery({
    queryKey: ['amparo-suggestions'],
    queryFn: operationService.getAmparoSuggestions,
    enabled,
    refetchInterval: 60_000,
  });
  const driversQuery = useQuery({
    queryKey: ['drivers'],
    queryFn: driversService.getAll,
    enabled: Boolean(selected),
  });
  const vehiclesQuery = useQuery({
    queryKey: ['vehicles'],
    queryFn: vehiclesService.getAll,
    enabled: Boolean(selected),
  });
  const confirmMutation = useMutation({
    mutationFn: operationService.confirmAmparo,
    onSuccess: async () => {
      showToast.success('Amparo confirmado; ambas operaciones comparten conductor y vehículo.');
      setSelected(null);
      setAgreementConfirmed(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['amparo-suggestions'] }),
        queryClient.invalidateQueries({ queryKey: ['trafico'] }),
      ]);
    },
    onError: (error) =>
      showToast.error(getUserFriendlyErrorMessage(error, 'No se pudo confirmar el amparo.')),
  });

  useEffect(() => {
    if (enabled && suggestionsQuery.isError) {
      showToast.error(
        suggestionsQuery.error,
        'No se pudieron consultar las posibilidades de amparo.',
      );
    }
  }, [enabled, suggestionsQuery.error, suggestionsQuery.isError]);

  const suggestions = suggestionsQuery.data ?? [];
  if (!enabled) return null;

  const openConfirmation = (suggestion: AmparoSuggestion) => {
    setAgreementConfirmed(false);
    setDriverId(
      String(suggestion.exportOperation.driver?.id ?? suggestion.importOperation.driver?.id ?? ''),
    );
    setVehicleId(
      String(suggestion.exportOperation.vehicle?.id ?? suggestion.importOperation.vehicle?.id ?? ''),
    );
    setSelected(suggestion);
  };
  const confirm = () => {
    if (!selected || !driverId || !vehicleId) return;
    if (user?.role === 'ANALISTA' && !agreementConfirmed) return;
    confirmMutation.mutate({
      exportOperationId: selected.exportOperation.id,
      importOperationId: selected.importOperation.id,
      driverId: Number(driverId),
      vehicleId: Number(vehicleId),
    });
  };

  return (
    <section
      aria-labelledby="amparos-panel-title"
      className={styles.panel}
    >
      <div className={styles.panelHeader}>
        <div className={styles.heading}>
          <span className={styles.headingIcon}>
            <ShieldCheck size={21} aria-hidden="true" />
          </span>
          <div className={styles.headingText}>
            <h2 id="amparos-panel-title">
              Amparos disponibles
            </h2>
            <p>Operaciones de exportación e importación compatibles para compartir recursos.</p>
          </div>
        </div>
        {!suggestionsQuery.isLoading && !suggestionsQuery.isError && (
          <span className={styles.count}>
            {suggestions.length}
            {suggestions.length === 1 ? ' oportunidad' : ' oportunidades'}
          </span>
        )}
      </div>
      {suggestionsQuery.isLoading ? (
        <div className={styles.panelMessage} role="status">
          <Loader2 size={17} className={styles.loaderSpin} aria-hidden="true" />
          Consultando operaciones compatibles…
        </div>
      ) : suggestionsQuery.isError && suggestions.length === 0 ? (
        <div className={`${styles.panelMessage} ${styles.panelError}`} role="alert">
          <span>
            {getUserFriendlyErrorMessage(
              suggestionsQuery.error,
              'No se pudieron consultar las posibilidades de amparo.',
            )}
          </span>
          <button
            type="button"
            className={styles.retryButton}
            onClick={() => void suggestionsQuery.refetch()}
          >
            Reintentar
          </button>
        </div>
      ) : suggestions.length === 0 ? (
        <p className={styles.panelMessage}>
          No hay amparos disponibles. Se requieren operaciones activas de exportación e importación
          con citas en el mismo puerto y dentro de la misma hora.
        </p>
      ) : (
        <div className={styles.suggestions}>
          {suggestions.map(({ exportOperation, importOperation }) => (
            <article
              key={`${exportOperation.id}-${importOperation.id}`}
              className={styles.suggestion}
            >
              <div className={styles.suggestionMeta}>
                <span className={styles.metaItem}>
                  <MapPin size={16} aria-hidden="true" />
                  {exportOperation.port?.name ?? 'Puerto sin nombre'}
                </span>
                <span className={styles.metaItem}>
                  <CalendarClock size={16} aria-hidden="true" />
                  {formatAppointment(exportOperation.appointmentAt)}
                </span>
                <span className={styles.compatibleBadge}>Citas compatibles</span>
              </div>
              <div className={styles.operationPair}>
                <div className={`${styles.operation} ${styles.exportOperation}`}>
                  <p className={styles.operationType}>
                    Exportación · #{exportOperation.id}
                  </p>
                  <p className={styles.orderNumber}>
                    Pedido: {exportOperation.numeroPedido || 'Sin número de pedido'}
                  </p>
                  <p className={styles.containerNumber}>
                    {exportOperation.containerNumber || 'Contenedor sin asignar'}
                  </p>
                  <p className={styles.analyst}>
                    Responsable: {exportOperation.analyst?.name || 'Sin asignar'}
                  </p>
                </div>
                <span className={styles.pairConnector} aria-label="amparada con">
                  <ArrowRight size={19} aria-hidden="true" />
                </span>
                <div className={`${styles.operation} ${styles.importOperation}`}>
                  <p className={styles.operationType}>
                    Importación · #{importOperation.id}
                  </p>
                  <p className={styles.orderNumber}>
                    Pedido: {importOperation.numeroPedido || 'Sin número de pedido'}
                  </p>
                  <p className={styles.containerNumber}>
                    {importOperation.containerNumber || 'Contenedor sin asignar'}
                  </p>
                  <p className={styles.analyst}>
                    Responsable: {importOperation.analyst?.name || 'Sin asignar'}
                  </p>
                </div>
              </div>
              {user?.role === 'ANALISTA' && (
                <div role="note" className={styles.agreementNote}>
                  <AlertTriangle
                    size={18}
                    className={styles.noteIcon}
                    aria-hidden="true"
                  />
                  <p className={styles.noteText}>
                    Habla con el analista{' '}
                    <strong>
                      {getCounterpartAnalystName(
                        { exportOperation, importOperation },
                        user.id,
                      )}
                    </strong>{' '}
                    antes de aceptar. Si llegan a un acuerdo, el conductor y el vehículo
                    seleccionados se asignarán automáticamente a ambas operaciones y quedarán en su
                    trazabilidad.
                  </p>
                </div>
              )}
              {canConfirmAmparo && (
                <button
                  type="button"
                  onClick={() => openConfirmation({ exportOperation, importOperation })}
                  className={styles.acceptButton}
                >
                  Revisar y aceptar
                </button>
              )}
            </article>
          ))}
        </div>
      )}

      <SuperModal
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Confirmar amparo"
        width="520px"
      >
        {selected && (
          <div className={styles.modalContent}>
            <p className={styles.modalIntro}>
              Vas a relacionar estos pedidos:
            </p>
            <div className={styles.modalOperations}>
              <div className={`${styles.modalOperation} ${styles.exportOperation}`}>
                <p className={styles.operationType}>Exportación</p>
                <p className={styles.modalOrder}>
                  Pedido: {selected.exportOperation.numeroPedido || 'Sin número de pedido'}
                </p>
                <p className={styles.modalOperationId}>Operación #{selected.exportOperation.id}</p>
              </div>
              <div className={`${styles.modalOperation} ${styles.importOperation}`}>
                <p className={styles.operationType}>Importación</p>
                <p className={styles.modalOrder}>
                  Pedido: {selected.importOperation.numeroPedido || 'Sin número de pedido'}
                </p>
                <p className={styles.modalOperationId}>Operación #{selected.importOperation.id}</p>
              </div>
            </div>
            <p className={styles.modalDescription}>
              Al aceptar, se asignarán el conductor y el vehículo seleccionados a ambas operaciones.
              La relación entre los pedidos, la aceptación y las asignaciones quedarán registradas
              en la trazabilidad de ambas.
            </p>
            {user?.role === 'ANALISTA' && (
              <label className={styles.agreementCheckbox}>
                <input
                  type="checkbox"
                  checked={agreementConfirmed}
                  onChange={(event) => setAgreementConfirmed(event.target.checked)}
                />
                <span>
                  Confirmo que hablé y llegué a un acuerdo con{' '}
                  <strong>
                    {getCounterpartAnalystName(selected, user.id)}
                  </strong>
                  .
                </span>
              </label>
            )}
            <label className={styles.fieldLabel}>
              Conductor
              <select
                value={driverId}
                onChange={(event) => setDriverId(event.target.value)}
                disabled={driversQuery.isLoading}
                className={styles.select}
              >
                <option value="">Seleccionar conductor</option>
                {(driversQuery.data ?? []).filter((driver) => driver.isActive).map((driver) => (
                  <option key={driver.id} value={driver.id}>{driver.name || driver.cedula}</option>
                ))}
              </select>
            </label>
            <label className={styles.fieldLabel}>
              Vehículo
              <select
                value={vehicleId}
                onChange={(event) => setVehicleId(event.target.value)}
                disabled={vehiclesQuery.isLoading}
                className={styles.select}
              >
                <option value="">Seleccionar vehículo</option>
                {(vehiclesQuery.data ?? [])
                  .filter((vehicle) =>
                    vehicle.status === 'AVAILABLE' ||
                    vehicle.status === 'IN_TRANSIT' ||
                    vehicle.id === selected.exportOperation.vehicle?.id ||
                    vehicle.id === selected.importOperation.vehicle?.id,
                  )
                  .map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate} · {vehicle.status === 'IN_TRANSIT' ? 'En operación' : 'Disponible'}
                    </option>
                  ))}
              </select>
            </label>
            {(driversQuery.isError || vehiclesQuery.isError) && (
              <p role="alert" className={styles.loadError}>
                No se pudieron cargar los conductores o vehículos. Cierra y vuelve a abrir el diálogo.
              </p>
            )}
            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => setSelected(null)}
                disabled={confirmMutation.isPending}
                className={styles.cancelButton}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={
                  confirmMutation.isPending ||
                  (user?.role === 'ANALISTA' && !agreementConfirmed) ||
                  !driverId ||
                  !vehicleId ||
                  driversQuery.isLoading ||
                  vehiclesQuery.isLoading
                }
                className={styles.confirmButton}
              >
                {confirmMutation.isPending && (
                  <Loader2 size={15} className={styles.loaderSpin} />
                )}
                Aceptar y asignar a ambas operaciones
              </button>
            </div>
          </div>
        )}
      </SuperModal>
    </section>
  );
}
