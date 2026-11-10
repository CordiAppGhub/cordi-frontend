'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ChevronDown, ClipboardList, Loader2, RefreshCw, Truck, UserRound } from 'lucide-react';
import { SuperModal } from '@/components/organisms/modal/modal';
import { driversService } from '@/services/driver.service';
import { vehiclesService } from '@/services/vehicles.service';
import type { Operation } from '@/types/operation-types';
import type { AssignExternalResourcesPayload } from '@/services/operation.service';
import { showToast } from '@/utils/alerts';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';
import styles from './operation-resource-modal.module.css';

interface Props {
  operation: Operation | null;
  isAnalyst?: boolean;
  onClose: () => void;
  onSave: (
    operationId: number,
    resources:
      | { ownershipType: 'PROPIO'; driverId: number | null; vehicleId: number | null }
      | ({ ownershipType: 'TERCERO' } & AssignExternalResourcesPayload),
  ) => Promise<boolean>;
}

export function OperationResourceModal({
  operation,
  isAnalyst = false,
  onClose,
  onSave,
}: Props) {
  const [ownershipType, setOwnershipType] = useState<'PROPIO' | 'TERCERO'>(
    operation?.vehicle?.ownershipType === 'TERCERO' ? 'TERCERO' : 'PROPIO',
  );
  const [driverId, setDriverId] = useState(
    operation?.driverId ? String(operation.driverId) : '',
  );
  const [vehicleId, setVehicleId] = useState(
    operation?.vehicleId ? String(operation.vehicleId) : '',
  );
  const [isSaving, setIsSaving] = useState(false);
  const [plate, setPlate] = useState(operation?.vehicle?.plate ?? '');
  const [driverName, setDriverName] = useState(operation?.driver?.name ?? '');
  const [driverCedula, setDriverCedula] = useState(operation?.driver?.cedula ?? '');
  const [driverPhone, setDriverPhone] = useState(operation?.driver?.telefono ?? '');
  const [agreedFreight, setAgreedFreight] = useState(
    operation?.agreedFreight == null ? '' : String(operation.agreedFreight),
  );
  const driversQuery = useQuery({
    queryKey: ['drivers'],
    queryFn: driversService.getAll,
    enabled: Boolean(operation),
  });
  const vehiclesQuery = useQuery({
    queryKey: ['vehicles'],
    queryFn: vehiclesService.getAll,
    enabled: Boolean(operation) && !isAnalyst,
  });

  const save = async () => {
    if (!operation) return;
    const resources =
      ownershipType === 'PROPIO'
        ? {
            ownershipType,
            driverId: driverId ? Number(driverId) : null,
            vehicleId: vehicleId ? Number(vehicleId) : null,
          }
        : {
            ownershipType,
            plate: plate.trim(),
            driverName: driverName.trim(),
            driverCedula: driverCedula.trim(),
            driverPhone: driverPhone.trim(),
            agreedFreight: Number(agreedFreight),
          };
    setIsSaving(true);
    try {
      const success = await onSave(operation.id, resources);
      if (success) onClose();
    } catch (error) {
      showToast.error(
        getUserFriendlyErrorMessage(error, 'No se pudo guardar la reasignación.'),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const activeDrivers = (driversQuery.data ?? []).filter(
    (driver) => driver.isActive || driver.id === operation?.driverId,
  );
  const selectableDrivers = isAnalyst
    ? (driversQuery.data ?? []).filter((driver) => driver.isAvailable)
    : activeDrivers;
  const availableVehicles = (vehiclesQuery.data ?? []).filter((vehicle) =>
    vehicle.ownershipType === 'PROPIO' &&
    (vehicle.status === 'AVAILABLE' ||
      vehicle.status === 'IN_TRANSIT' ||
      vehicle.id === operation?.vehicleId),
  );
  const hasValidExternalValues =
    plate.trim().length > 0 &&
    driverName.trim().length > 0 &&
    driverCedula.trim().length > 0 &&
    driverPhone.trim().length > 0 &&
    Number.isFinite(Number(agreedFreight)) &&
    Number(agreedFreight) > 0;
  const isLoadingResources =
    driversQuery.isLoading || (!isAnalyst && vehiclesQuery.isLoading);
  const hasResourceError =
    driversQuery.isError || (!isAnalyst && vehiclesQuery.isError);

  return (
    <SuperModal
      isOpen={Boolean(operation)}
      onClose={onClose}
      title={
        operation
          ? `${isAnalyst ? 'Asignar conductor a' : 'Reasignar operación'} #${operation.id}`
          : isAnalyst
            ? 'Asignar conductor'
            : 'Reasignar operación'
      }
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
            <span className={styles.statusBadge}>{operation.status?.replace(/_/g, ' ')}</span>
          </div>

          {!isAnalyst && <div className={styles.ownershipToggle} role="group" aria-label="Tipo de flota">
            <button
              type="button"
              aria-pressed={ownershipType === 'PROPIO'}
              className={ownershipType === 'PROPIO' ? styles.activeTab : ''}
              onClick={() => {
                setOwnershipType('PROPIO');
                if (operation.vehicle?.ownershipType !== 'PROPIO') {
                  setVehicleId('');
                  setDriverId('');
                }
              }}
            >
              Flota propia
            </button>
            <button
              type="button"
              aria-pressed={ownershipType === 'TERCERO'}
              className={ownershipType === 'TERCERO' ? styles.activeTab : ''}
              onClick={() => {
                setOwnershipType('TERCERO');
                if (operation.vehicle?.ownershipType !== 'TERCERO') {
                  setPlate('');
                  setDriverName('');
                  setDriverCedula('');
                  setDriverPhone('');
                  setAgreedFreight('');
                }
              }}
            >
              Flota externa
            </button>
          </div>}

          <p className={styles.description}>
            {isAnalyst
              ? 'Selecciona un conductor disponible que no tenga otra operación pendiente. La asignación no cambiará el vehículo.'
              : ownershipType === 'PROPIO'
              ? 'Selecciona recursos registrados. El flete se calcula con la tarifa de Cordivehículos.'
              : 'Registra el vehículo y conductor externo para este viaje e ingresa el flete negociado.'}
          </p>

          {(isAnalyst || ownershipType === 'PROPIO') && isLoadingResources && (
            <div className={styles.loadingState} role="status">
              <Loader2 size={16} className={styles.spinner} />
              {isAnalyst ? 'Cargando conductores disponibles…' : 'Cargando conductores y vehículos…'}
            </div>
          )}

          {(isAnalyst || ownershipType === 'PROPIO') && hasResourceError && (
            <div className={styles.errorState} role="alert">
              <AlertCircle size={17} />
              <span>No se pudieron cargar todos los recursos. Puedes volver a intentarlo.</span>
              <button
                type="button"
                className={styles.retryButton}
                onClick={() => {
                  if (driversQuery.isError) void driversQuery.refetch();
                  if (!isAnalyst && vehiclesQuery.isError)
                    void vehiclesQuery.refetch();
                }}
              >
                <RefreshCw size={14} />
                Reintentar
              </button>
            </div>
          )}

          {isAnalyst ? (
            <div className={styles.fieldsGrid}>
              <label className={`${styles.field} ${styles.fullWidth}`} htmlFor={`operation-driver-${operation.id}`}>
                <span className={styles.fieldLabel}><UserRound size={15} /> Conductor disponible</span>
                <span className={styles.selectWrap}>
                  <select
                    id={`operation-driver-${operation.id}`}
                    value={driverId}
                    onChange={(event) => setDriverId(event.target.value)}
                    disabled={isLoadingResources || driversQuery.isError}
                    className={styles.select}
                  >
                    <option value="">Selecciona un conductor</option>
                    {selectableDrivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name || driver.cedula || `Conductor #${driver.id}`}
                        {driver.assignedVehiclePlate
                          ? ` · Vehículo ${driver.assignedVehiclePlate}`
                          : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} aria-hidden="true" />
                </span>
                <span className={styles.fieldHint}>
                  {driversQuery.data && selectableDrivers.length === 0
                    ? 'No hay conductores disponibles sin operaciones pendientes.'
                    : `${selectableDrivers.length} conductor(es) disponible(s).`}
                </span>
              </label>
            </div>
          ) : ownershipType === 'PROPIO' ? <div className={styles.fieldsGrid}>
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
                  {selectableDrivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name || driver.cedula || `Conductor #${driver.id}`}
                      {!driver.isActive ? ' · Inactivo (asignado)' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} aria-hidden="true" />
              </span>
              <span className={styles.fieldHint}>
                {driversQuery.data && selectableDrivers.length === 0
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
                  onChange={(event) => {
                    const nextVehicleId = event.target.value;
                    setVehicleId(nextVehicleId);
                    const selectedVehicle = (vehiclesQuery.data ?? []).find(
                      (vehicle) => vehicle.id === Number(nextVehicleId),
                    );
                    setDriverId(
                      selectedVehicle?.driverId
                        ? String(selectedVehicle.driverId)
                        : '',
                    );
                  }}
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
                        {vehicle.driver?.name
                          ? ` · ${vehicle.driver.name}`
                          : ' · Sin conductor'}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown size={15} aria-hidden="true" />
              </span>
              <span className={styles.fieldHint}>
                {vehiclesQuery.data && availableVehicles.length === 0
                  ? 'No hay vehículos propios disponibles para asignar.'
                  : 'Solo se muestran vehículos propios disponibles o asignados actualmente.'}
              </span>
            </label>
          </div> : <div className={styles.fieldsGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}><Truck size={15} /> Placa</span>
              <input className={styles.textInput} value={plate} onChange={(event) => setPlate(event.target.value)} required />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}><UserRound size={15} /> Nombre del conductor</span>
              <input className={styles.textInput} value={driverName} onChange={(event) => setDriverName(event.target.value)} required />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Cédula</span>
              <input className={styles.textInput} value={driverCedula} onChange={(event) => setDriverCedula(event.target.value)} required />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Teléfono</span>
              <input className={styles.textInput} type="tel" value={driverPhone} onChange={(event) => setDriverPhone(event.target.value)} required />
            </label>
            <label className={`${styles.field} ${styles.fullWidth}`}>
              <span className={styles.fieldLabel}>Tarifa Negociada (Flete Manual) · COP</span>
              <input
                className={styles.textInput}
                type="number"
                min="1"
                step="1"
                inputMode="decimal"
                value={agreedFreight}
                onChange={(event) => setAgreedFreight(event.target.value)}
                placeholder="Valor en COP"
                required
              />
            </label>
          </div>}

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
              disabled={
                isSaving ||
                  (isAnalyst && !driverId) ||
                (ownershipType === 'PROPIO' &&
                  (isLoadingResources || hasResourceError)) ||
                (ownershipType === 'TERCERO' && !hasValidExternalValues)
              }
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
