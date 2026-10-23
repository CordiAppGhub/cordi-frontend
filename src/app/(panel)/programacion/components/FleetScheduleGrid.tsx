'use client';

import { useState } from 'react';
import { CalendarDays, LoaderCircle, Trash2, Truck } from 'lucide-react';
import { useVehicles } from '@/hooks/use-vehicles';
import { useProgramacion } from '../hooks/useProgramacion';
import styles from './fleet-schedule.module.css';

const getTomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const isAwaitingVehicle = (status: string) =>
  status === 'CREADO' || status === 'PROGRAMADO';

export default function FleetScheduleGrid() {
  const [selectedDate, setSelectedDate] = useState(getTomorrow);
  const [vehicleByOperation, setVehicleByOperation] = useState<Record<number, string>>({});
  const {
    operations,
    isLoadingOperations,
    operationsError,
    assignVehicle,
    isAssigningVehicle,
    cancelOperation,
    isCancelling,
  } = useProgramacion(selectedDate);
  const { vehicles, isLoading: isLoadingVehicles } = useVehicles();

  const availableVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.status === 'AVAILABLE' || vehicle.status === 'IN_TRANSIT',
  );

  const handleAssign = async (operationId: number) => {
    const vehicleId = Number(vehicleByOperation[operationId]);
    if (!vehicleId) return;
    await assignVehicle(operationId, vehicleId);
  };

  const handleCancel = async (operationId: number) => {
    await cancelOperation(operationId);
  };

  return (
    <section className={styles.requestPanel}>
      <header className={styles.requestHeader}>
        <div>
          <h1 className={styles.requestTitle}>Solicitudes de operación</h1>
          <p className={styles.requestSubtitle}>
            Revisa las solicitudes de los analistas y asigna el vehículo para cada operación.
          </p>
        </div>
        <label className={styles.dateFilter}>
          <CalendarDays size={16} aria-hidden="true" />
          <span>Fecha de operación</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </label>
      </header>

      {isLoadingOperations ? (
        <div className={styles.requestMessage} role="status">
          <LoaderCircle className={styles.spinner} size={18} />
          Cargando solicitudes…
        </div>
      ) : operationsError ? (
        <div className={styles.requestMessage} role="alert">
          No se pudieron cargar las solicitudes. Intenta actualizar la página.
        </div>
      ) : operations.length === 0 ? (
        <div className={styles.requestMessage}>
          No hay operaciones registradas para esta fecha.
        </div>
      ) : (
        <div className={styles.requestTableWrap}>
          <table className={styles.requestTable}>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Operación</th>
                <th>Analista</th>
                <th>Hora</th>
                <th>Vehículo</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {operations.map((operation) => {
                const pending =
                  isAwaitingVehicle(operation.status) && !operation.vehicleId;
                const selectedVehicle = vehicleByOperation[operation.id] || '';
                return (
                  <tr key={operation.id}>
                    <td>{operation.client?.razonSocial || 'Cliente sin nombre'}</td>
                    <td>
                      <strong>{operation.type.replace(/_/g, ' ')}</strong>
                      <small>Solicitud #{operation.id}</small>
                    </td>
                    <td>{operation.analyst?.name || '—'}</td>
                    <td>
                      {operation.scheduledAt
                        ? new Date(operation.scheduledAt).toLocaleTimeString('es-CO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td>
                      {pending ? (
                        <select
                          aria-label={`Vehículo para la operación ${operation.id}`}
                          value={selectedVehicle}
                          onChange={(event) =>
                            setVehicleByOperation((current) => ({
                              ...current,
                              [operation.id]: event.target.value,
                            }))
                          }
                          disabled={isLoadingVehicles || availableVehicles.length === 0}
                        >
                          <option value="">Seleccionar vehículo</option>
                          {availableVehicles.map((vehicle) => (
                            <option key={vehicle.id} value={vehicle.id}>
                              {vehicle.plate}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span>
                          {operation.vehicle?.plate ||
                            (operation.vehicleId
                              ? `Vehículo #${operation.vehicleId}`
                              : '—')}
                        </span>
                      )}
                    </td>
                    <td>
                      {pending ? (
                        <button
                          type="button"
                          className={styles.assignButton}
                          onClick={() => void handleAssign(operation.id)}
                          disabled={!selectedVehicle || isAssigningVehicle}
                        >
                          {isAssigningVehicle ? (
                            <LoaderCircle className={styles.spinner} size={15} />
                          ) : (
                            <Truck size={15} />
                          )}
                          Asignar vehículo
                        </button>
                      ) : (
                        operation.vehicleId ? (
                          <span className={styles.assignedStatus}>Vehículo asignado</span>
                        ) : (
                          <span>—</span>
                        )
                      )}
                      {operation.status !== 'CANCELADO' &&
                        operation.status !== 'FINALIZADO' &&
                        operation.status !== 'EN_CURSO' && (
                          <button
                            type="button"
                            className={styles.cancelButton}
                            onClick={() => void handleCancel(operation.id)}
                            disabled={isCancelling}
                          >
                            <Trash2 size={14} />
                            Cancelar
                          </button>
                        )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
