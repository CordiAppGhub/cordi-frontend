'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ChevronDown, ClipboardList, Loader2, RefreshCw, Truck, UserRound } from 'lucide-react';
import { SuperModal } from '@/components/organisms/modal/modal';
import { driversService } from '@/services/driver.service';
import { vehiclesService } from '@/services/vehicles.service';
import { Operation } from '@/types/operation-types';
import { showToast } from '@/utils/alerts';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';
import styles from './OperationResourceModal.module.css';

interface Props {
  operation: Operation | null;
  onClose: () => void;
  onSave: (operationId: number, resources: { driverId: number | null; vehicleId: number | null }) => Promise<boolean>;
}

export function OperationResourceModal({ operation, onClose, onSave }: Props) {
  const [driverId, setDriverId] = useState(
    operation?.driverId ? String(operation.driverId) : '',
  );
  const [vehicleId, setVehicleId] = useState(
    operation?.vehicleId ? String(operation.vehicleId) : '',
  );
  const [isSaving, setIsSaving] = useState(false);
  const driversQuery = useQuery({
    queryKey: ['drivers'],
    queryFn: driversService.getAll,
    enabled: Boolean(operation),
  });
  const vehiclesQuery = useQuery({
    queryKey: ['vehicles'],
    queryFn: vehiclesService.getAll,
    enabled: Boolean(operation),
  });

  const save = async () => {
    if (!operation) return;
    setIsSaving(true);
    try {
      const success = await onSave(operation.id, {
        driverId: driverId ? Number(driverId) : null,
        vehicleId: vehicleId ? Number(vehicleId) : null,
      });
      if (success) onClose();
    } catch (error) {
      showToast.error(getUserFriendlyErrorMessage(error, 'No se pudo guardar la reasignación.'));
    } finally {
      setIsSaving(false);
    }
  };

  const activeDrivers = (driversQuery.data ?? []).filter(
    (driver) => driver.isActive || driver.id === operation?.driverId,
  );
  const availableVehicles = (vehiclesQuery.data ?? []).filter((vehicle) =>
    vehicle.status === 'AVAILABLE' ||
    vehicle.status === 'IN_TRANSIT' ||
    vehicle.id === operation?.vehicleId,
  );
  const isLoadingResources = driversQuery.isLoading || vehiclesQuery.isLoading;
  const hasResourceError = driversQuery.isError || vehiclesQuery.isError;

  return (
    <SuperModal
      isOpen={Boolean(operation)}
      onClose={onClose}
      title={operation ? `Reasignar operación #${operation.id}` : 'Reasignar operación'}
      width="620px"
    >
      {operation && (
        <div className={styles.modalBody}>
          <div className={styles.operationSummary}>
            <span className={styles.operationIcon}><ClipboardList size={19} /></span>
            <div className={styles.operationDetails}>
              <span className={styles.summaryEyebrow}>Operación seleccionada</span>
              <strong>#{operation.id} · {operation.type.replace(/_/g, ' ')}</strong>
              <span>{operation.containerNumber || 'Sin contenedor asociado'}</span>
            </div>
            <span className={styles.statusBadge}>{operation.status.replace(/_/g, ' ')}</span>
          </div>

          <p className={styles.description}>
            Selecciona los recursos que continuarán este viaje. La reasignación quedará registrada en la trazabilidad.
          </p>

          {isLoadingResources && (
            <div className={styles.loadingState} role="status">
              <Loader2 size={16} className={styles.spinner} />
              Cargando conductores y vehículos…
            </div>
          )}

          {hasResourceError && (
            <div className={styles.errorState} role="alert">
              <AlertCircle size={17} />
              <span>No se pudieron cargar todos los recursos. Puedes volver a intentarlo.</span>
              <button
                type="button"
                className={styles.retryButton}
                onClick={() => {
                  if (driversQuery.isError) void driversQuery.refetch();
                  if (vehiclesQuery.isError) void vehiclesQuery.refetch();
                }}
              >
                <RefreshCw size={14} />
                Reintentar
              </button>
            </div>
          )}

          <div className={styles.fieldsGrid}>
            <label className={styles.field} htmlFor={`operation-driver-${operation.id}`}>
              <span className={styles.fieldLabel}><UserRound size={15} /> Conductor</span>
              <span className={styles.selectWrap}>
                <select
                  id={`operation-driver-${operation.id}`}
                  value={driverId}
                  onChange={(event) => setDriverId(event.target.value)}
                  disabled={isLoadingResources || driversQuery.isError}
                  className={styles.select}
                >
                  <option value="">Sin conductor</option>
                  {activeDrivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name || driver.cedula || `Conductor #${driver.id}`}
                      {!driver.isActive ? ' · Inactivo (asignado)' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} aria-hidden="true" />
              </span>
              <span className={styles.fieldHint}>
                {driversQuery.data && activeDrivers.length === 0
                  ? 'No hay conductores activos disponibles.'
                  : 'Solo se muestran conductores activos y el asignado actualmente.'}
              </span>
            </label>

            <label className={styles.field} htmlFor={`operation-vehicle-${operation.id}`}>
              <span className={styles.fieldLabel}><Truck size={15} /> Vehículo</span>
              <span className={styles.selectWrap}>
                <select
                  id={`operation-vehicle-${operation.id}`}
                  value={vehicleId}
                  onChange={(event) => setVehicleId(event.target.value)}
                  disabled={isLoadingResources || vehiclesQuery.isError}
                  className={styles.select}
                >
                  <option value="">Sin vehículo</option>
                  {availableVehicles.map((vehicle) => {
                    const statusLabel = vehicle.status === 'IN_TRANSIT'
                      ? 'En operación'
                      : vehicle.status === 'AVAILABLE'
                        ? 'Disponible'
                        : 'Asignado actualmente';
                    return (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.plate} · {statusLabel}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown size={15} aria-hidden="true" />
              </span>
              <span className={styles.fieldHint}>
                {vehiclesQuery.data && availableVehicles.length === 0
                  ? 'No hay vehículos disponibles para asignar.'
                  : 'Se muestran vehículos disponibles, en operación y el asignado actualmente.'}
              </span>
            </label>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className={styles.cancelButton}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={isSaving || isLoadingResources || hasResourceError}
              className={styles.saveButton}
            >
              {isSaving && <Loader2 size={15} className={styles.spinner} />}
              Guardar reasignación
            </button>
          </div>
        </div>
      )}
    </SuperModal>
  );
}
