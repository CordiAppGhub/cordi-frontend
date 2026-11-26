'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  LoaderCircle,
  Search,
  Trash2,
  Truck,
  Unlink,
} from 'lucide-react';
import { Button } from '@/components/atoms/button/button';
import PaginationTable from '@/components/organisms/pagination-table/pagination-table';
import { useProgramacion } from '../hooks/useProgramacion';
import { userService } from '@/services/userService';
import type { ScheduleOperationsFilters } from '@/services/operation.service';
import type { ColumnDef } from '@/types/table';
import type { Operation } from '@/types/operation-types';
import { OperationDispatchDrawer } from '@/app/(panel)/operations/components/actions/operation-dispatch-drawer';
import { useAuthStore } from '@/store/use-auth.store';
import { TRAILER_TYPE_LABELS } from '@/types/vehicles';
import { getOperationRouteNames } from '@/utils/operation-route';
import Swal from 'sweetalert2';
import styles from './fleet-schedule.module.css';

const getDateRange = () => {
  const date = new Date();
  const end = formatDate(date);
  date.setDate(date.getDate() - 6);
  return { fechaInicio: formatDate(date), fechaFin: end };
};

const formatDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const isAwaitingVehicle = (status: string) =>
  status === 'CREADO' || status === 'PROGRAMADO';

const operationStatuses = [
  'CREADO',
  'PROGRAMADO',
  'PROGRAMADA',
  'ASIGNADO',
  'PENDIENTE_PROGRAMACION',
  'PENDIENTE',
  'PENDIENTE_CARGUE',
  'LISTA_PARA_CARGUE',
  'EN_CURSO',
  'CIERRE_FISICO',
  'FINALIZADO',
  'PAUSADA',
  'CANCELADO',
  'DESVIO_REPORTADO',
];

interface AnalystOperationGroup {
  id: string;
  analystId: number | null;
  analystName: string;
  operations: Operation[];
}

export default function FleetScheduleGrid() {
  const [filters, setFilters] = useState<ScheduleOperationsFilters>(
    getDateRange,
  );
  const [selectedOperationId, setSelectedOperationId] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const { user } = useAuthStore();
  useEffect(() => {
    const initial = setTimeout(() => setNow(Date.now()), 0);
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, []);
  const analystsQuery = useQuery({
    queryKey: ['users', 'analysts', 'schedule-filter'],
    queryFn: userService.getAll,
    staleTime: 5 * 60 * 1000,
  });
  const {
    operations,
    isLoadingOperations,
    operationsError,
    cancelOperation,
    isCancelling,
    unassignVehicle,
    isUnassigningVehicle,
  } = useProgramacion(filters);
  const analysts = (analystsQuery.data ?? []).filter(
    (user) => user.role === 'ANALISTA' && user.isActive,
  );

  const isLooseForeignTradeOperation = (
    operation: (typeof operations)[number],
  ) => {
    const cargoType =
      'cargoType' in operation ? operation.cargoType : undefined;
    return (
      (operation.isContainerized === false ||
        operation.tipoCarga === 'SUELTA' ||
        cargoType === 'LOOSE_CARGO') &&
      [
        'IMPORTACION',
        'EXPORTACION',
        'EXPORTACION_ANTICIPADA',
      ].includes(operation.type)
    );
  };
  const hasScheduledProgramming = (
    operation: (typeof operations)[number],
  ) => Boolean(operation.scheduledAt);
  const isFleetAssignmentAllowed = (
    operation: (typeof operations)[number],
  ) => {
    const isLooseForeignTrade = isLooseForeignTradeOperation(operation);
    if (isLooseForeignTrade) {
      const needsFleet = !operation.vehicleId || !operation.driverId;
      const isAssignableStatus = ![
        'CANCELADO',
        'FINALIZADO',
        'EN_CURSO',
        'CIERRE_FISICO',
        'PAUSADA',
      ].includes(operation.status);
      return (
        needsFleet &&
        isAssignableStatus
      );
    }

    return (
      !operation.vehicleId &&
      [
        'CREADO',
        'PROGRAMADO',
        'PROGRAMADA',
        'PENDIENTE_PROGRAMACION',
        'LISTA_PARA_CARGUE',
        'PENDIENTE',
      ].includes(operation.status)
    );
  };
  const canAssignFleet = (operation: (typeof operations)[number]) =>
    isFleetAssignmentAllowed(operation) && hasScheduledProgramming(operation);
  const selectedOperation =
    operations.find(
      (operation) =>
        operation.id === selectedOperationId && canAssignFleet(operation),
    ) ?? null;

  const closeAssignDrawer = () => setSelectedOperationId(null);

  const handleCancel = async (operationId: number) => {
    await cancelOperation(operationId);
  };

  const handleUnassign = async (operationId: number) => {
    const result = await Swal.fire({
      title: '¿Quitar la asignación?',
      text: '¿Estás seguro de quitar la asignación de este vehículo?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, quitar asignación',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#dc2626',
    });

    if (result.isConfirmed) {
      await unassignVehicle(operationId);
    }
  };

  const updateFilter = <K extends keyof ScheduleOperationsFilters>(
    key: K,
    value: ScheduleOperationsFilters[K],
  ) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({ ...getDateRange(), requiereAccion: false });
  };

  const isUrgentOperation = (operation: Operation) => {
    const pending = isAwaitingVehicle(operation.status) && !operation.vehicleId;
    if (!pending || now === null) return false;

    return [
      ...(operation.type !== 'NACIONAL'
        ? [operation.fechaCitaOrigen, operation.fechaCitaDestino]
        : []),
      operation.scheduledAt,
    ].some((value) => {
      if (!value) return false;
      const remaining = new Date(value).getTime() - now;
      return remaining >= 0 && remaining < 120 * 60000;
    });
  };

  const getActionReason = (operation: Operation) => {
    const missingFreight =
      !operation.fleteACobrar && !operation.fleteACobrarManual;
    const needsFleet = !operation.vehicleId || !operation.driverId;

    return operation.status === 'CANCELADO' ||
      operation.status === 'FINALIZADO'
      ? null
      : operation.status === 'PENDIENTE_PROGRAMACION'
        ? 'Requiere acción · Falta programación'
        : needsFleet
          ? `Requiere acción · Asignar flota${missingFreight ? ' · Sin flete' : ''}`
          : missingFreight
            ? 'Requiere acción · Falta flete'
            : null;
  };

  const requiresAction = (operation: Operation) => {
    const pending = isAwaitingVehicle(operation.status) && !operation.vehicleId;
    return (
      pending ||
      operation.status === 'PENDIENTE_PROGRAMACION' ||
      operation.status === 'PENDIENTE' ||
      operation.status === 'PENDIENTE_CARGUE' ||
      operation.status === 'CIERRE_FISICO' ||
      getActionReason(operation) !== null
    );
  };

  const groupsByAnalyst = new Map<string, AnalystOperationGroup>();
  operations.forEach((operation) => {
    const analystId = operation.analyst?.id ?? null;
    const groupId = analystId === null ? 'SIN_ANALISTA' : `analyst-${analystId}`;
    const existingGroup = groupsByAnalyst.get(groupId);

    if (existingGroup) {
      existingGroup.operations.push(operation);
      return;
    }

    groupsByAnalyst.set(groupId, {
      id: groupId,
      analystId,
      analystName:
        operation.analyst?.name?.trim() ||
        (analystId === null
          ? 'Sin analista asignado'
          : `Analista #${analystId}`),
      operations: [operation],
    });
  });

  const analystGroups = [...groupsByAnalyst.values()].sort((left, right) => {
    const leftUnassigned = left.analystId === null;
    const rightUnassigned = right.analystId === null;
    const leftUnassignedUrgent =
      leftUnassigned && left.operations.some(isUrgentOperation);
    const rightUnassignedUrgent =
      rightUnassigned && right.operations.some(isUrgentOperation);

    if (leftUnassignedUrgent !== rightUnassignedUrgent) {
      return leftUnassignedUrgent ? -1 : 1;
    }
    if (leftUnassigned !== rightUnassigned) return leftUnassigned ? 1 : -1;
    return left.analystName.localeCompare(right.analystName, 'es', {
      sensitivity: 'base',
    });
  });

  const groupColumns: ColumnDef<AnalystOperationGroup>[] = [
    {
      id: 'analystGroup',
      header: 'Solicitudes por analista',
      renderCell: (group) => {
        const readyCount = group.operations.filter(canAssignFleet).length;
        const actionCount = group.operations.filter(requiresAction).length;

        return (
          <div className={styles.analystGroupHeader}>
            <strong>{group.analystName}</strong>
            <span>
              {group.operations.length} solicitudes · {readyCount} listas para asignar · {actionCount} requieren acción
            </span>
          </div>
        );
      },
    },
  ];

  const renderOperationRow = (operation: Operation) => {
    const { originName, destinationName } = getOperationRouteNames(operation);
    const pending = isAwaitingVehicle(operation.status) && !operation.vehicleId;
    const requiresActionStatus =
      pending ||
      operation.status === 'PENDIENTE_PROGRAMACION' ||
      operation.status === 'PENDIENTE' ||
      operation.status === 'PENDIENTE_CARGUE' ||
      operation.status === 'CIERRE_FISICO';
    const actionReason = getActionReason(operation);
    const actionRequired = requiresActionStatus || actionReason !== null;
    const assignFleet = isFleetAssignmentAllowed(operation);
    const hasScheduledAt = hasScheduledProgramming(operation);
    const statusLabel =
      actionReason ??
      (pending
        ? 'Pendiente de vehículo'
        : operation.status === 'ASIGNADO'
          ? 'Asignado'
          : operation.status.replace(/_/g, ' '));
    const hasAssignedVehicle = Boolean(operation.vehicleId);
    const canUnassign = operation.status === 'ASIGNADO';
    const urgent = isUrgentOperation(operation);

    return (
      <tr key={operation.id} className={urgent ? styles.urgentRow : undefined}>
        <td>{operation.client?.razonSocial || 'Cliente sin nombre'}</td>
        <td>
          <strong>{operation.type.replace(/_/g, ' ')}</strong>
          <small>Solicitud #{operation.id}</small>
          {urgent && <small>Próxima cita: menos de 2 horas</small>}
        </td>
        <td>{originName} → {destinationName}</td>
        <td>
          {operation.isContainerized
            ? 'Contenerizada'
            : operation.cargoVehicleType?.name ??
              'Configuración no disponible'}
          {operation.requiredTrailerType && (
            <small>
              Tráiler requerido:{' '}
              {TRAILER_TYPE_LABELS[operation.requiredTrailerType]}
            </small>
          )}
          {!operation.isContainerized && operation.weight != null && (
            <small>{operation.weight.toLocaleString('es-CO')} kg</small>
          )}
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
          <span
            className={
              actionRequired ? styles.pendingStatus : styles.assignedStatus
            }
          >
            {statusLabel}
          </span>
        </td>
        <td>
          <span>
            {operation.vehicle?.plate ||
              (operation.vehicleId
                ? `Vehículo #${operation.vehicleId}`
                : '—')}
          </span>
        </td>
        <td>
          {hasAssignedVehicle && (
            <Button
              variant="secondary"
              type="button"
              className={styles.unassignButton}
              onClick={() => void handleUnassign(operation.id)}
              disabled={!canUnassign || isUnassigningVehicle}
              aria-label={`Quitar asignación de la operación ${operation.id}`}
              title={
                canUnassign
                  ? 'Quitar asignación'
                  : 'Operación en curso, no se puede desasignar'
              }
            >
              <Unlink size={14} />
              Quitar asignación
            </Button>
          )}
          {assignFleet ? (
            <span
              className={styles.assignTooltipWrapper}
              data-tooltip={
                !hasScheduledAt ? 'Falta fecha de programación' : undefined
              }
              title={
                !hasScheduledAt ? 'Falta fecha de programación' : undefined
              }
            >
            <Button
              variant="primary"
              type="button"
              className={styles.assignButton}
              onClick={() => setSelectedOperationId(operation.id)}
              disabled={!hasScheduledAt}
              title={hasScheduledAt ? 'Asignar flota' : undefined}
              aria-label={`Asignar flota a la operación ${operation.id}`}
            >
              <Truck size={15} />
              Asignar flota
            </Button>
            </span>
          ) : operation.vehicleId ? (
            <span className={styles.assignedStatus}>Vehículo asignado</span>
          ) : (
            <span>—</span>
          )}
          {operation.status !== 'CANCELADO' &&
            operation.status !== 'FINALIZADO' &&
            operation.status !== 'CIERRE_FISICO' &&
            operation.status !== 'EN_CURSO' && (
              <Button
                variant="secondary"
                type="button"
                className={styles.cancelButton}
                onClick={() => void handleCancel(operation.id)}
                disabled={isCancelling}
              >
                <Trash2 size={14} />
                Cancelar
              </Button>
            )}
        </td>
      </tr>
    );
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
      </header>

      <div className={styles.filtersBar} aria-label="Filtros de solicitudes">
        <button
          type="button"
          className={`${styles.actionFilter} ${
            filters.requiereAccion ? styles.actionFilterActive : ''
          }`}
          aria-pressed={filters.requiereAccion === true}
          onClick={() =>
            updateFilter('requiereAccion', !filters.requiereAccion)
          }
        >
          <span className={styles.actionFilterDot} />
          Requiere Acción
          {filters.requiereAccion && <span className={styles.onlyPending}>Solo pendientes</span>}
        </button>

        <label className={styles.filterField}>
          <span><CalendarDays size={14} aria-hidden="true" /> Desde</span>
          <input
            type="date"
            value={filters.fechaInicio ?? ''}
            disabled={filters.requiereAccion}
            onChange={(event) => updateFilter('fechaInicio', event.target.value)}
          />
        </label>
        <label className={styles.filterField}>
          <span><CalendarDays size={14} aria-hidden="true" /> Hasta</span>
          <input
            type="date"
            value={filters.fechaFin ?? ''}
            disabled={filters.requiereAccion}
            onChange={(event) => updateFilter('fechaFin', event.target.value)}
          />
        </label>
        <label className={styles.filterField}>
          <span>Estado</span>
          <select
            value={filters.estado ?? ''}
            onChange={(event) => updateFilter('estado', event.target.value || undefined)}
          >
            <option value="">Todos los estados</option>
            {operationStatuses.map((status) => (
              <option key={status} value={status}>
                {status.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.filterField}>
          <span>Analista</span>
          <select
            value={filters.analystId ?? ''}
            onChange={(event) =>
              updateFilter(
                'analystId',
                event.target.value ? Number(event.target.value) : undefined,
              )
            }
            disabled={analystsQuery.isLoading}
          >
            <option value="">Todos los analistas</option>
            {analysts.map((analyst) => (
              <option key={analyst.id} value={analyst.id}>
                {analyst.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.searchField}>
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={filters.busqueda ?? ''}
            onChange={(event) => updateFilter('busqueda', event.target.value)}
            placeholder="Placa, contenedor o manifiesto"
            aria-label="Buscar por placa, contenedor o manifiesto"
          />
        </label>
        <button
          type="button"
          className={styles.resetFilters}
          onClick={resetFilters}
        >
          Limpiar filtros
        </button>
      </div>

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
        <PaginationTable<AnalystOperationGroup>
          data={analystGroups}
          columns={groupColumns}
          collapse
          hideToolbar
          hidePagination
          totalPages={1}
          currentPage={1}
          onPageChange={() => undefined}
          renderExpandedContent={(group) => (
            <div className={styles.requestTableWrap}>
              <table className={styles.requestTable}>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Operación</th>
                    <th>Ruta</th>
                    <th>Configuración vehicular</th>
                    <th>Analista</th>
                    <th>Hora</th>
                    <th>Estado</th>
                    <th>Vehículo</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>{group.operations.map(renderOperationRow)}</tbody>
              </table>
            </div>
          )}
        />
      )}
      <OperationDispatchDrawer
        key={selectedOperation?.id ?? 'closed'}
        operation={selectedOperation}
        isAnalyst={user?.role === 'ANALISTA'}
        onClose={closeAssignDrawer}
        onAssigned={closeAssignDrawer}
      />
    </section>
  );
}
