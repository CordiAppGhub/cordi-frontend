'use client';

import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Search,
  Truck,
  UserRound,
} from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import type { ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { Button } from '@/components/atoms/button/button';
import { Drawer } from '@/components/Drawer';
import { useFleetLive } from '@/hooks/use-fleet-live';
import { driversService } from '@/services/driver.service';
import {
  type FleetLiveStatus,
  type FleetLiveTrailer,
  type FleetLiveVehicle,
} from '@/services/fleet-live.service';
import {
  type AssignExternalResourcesPayload,
  operationService,
} from '@/services/operation.service';
import {
  createExternalFleetDispatchSchema,
  type ExternalFleetDispatchInput,
  type ExternalFleetDispatchValues,
} from '@/schemas/operation-dispatch.schema';
import type { Driver } from '@/types/drivers';
import type { Operation } from '@/types/operation-types';
import {
  getFleetConfigurationCode,
  TRAILER_TYPE_LABELS,
} from '@/types/vehicles';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';
import { showToast } from '@/utils/alerts';
import { getOperationRouteNames } from '@/utils/operation-route';
import styles from './operation-dispatch-drawer.module.css';

interface OperationDispatchDrawerProps {
  operation: Operation | null;
  isAnalyst: boolean;
  onClose: () => void;
  onAssigned?: (operation: Operation) => void;
}

type DispatchTab = 'PROPIO' | 'TERCERO';
type DeadlineState = 'closed' | 'overdue' | 'soon' | 'on-time' | 'missing';

interface BackendError {
  code?: string;
  message?: string;
}

const statusLabels: Record<FleetLiveStatus, string> = {
  AVAILABLE: 'Disponible',
  ENDING_SOON: 'Por finalizar',
  BUSY: 'Ocupado',
  UNAVAILABLE: 'No disponible',
};

const typeLabels: Record<string, string> = {
  EXPO: 'EXPORTACION',
  EXPORTACION: 'EXPORTACION',
  IMPO: 'IMPORTACION',
  IMPORTACION: 'IMPORTACION',
  RETIRO_VACIO: 'RETIRO_VACIO',
  DEVOLUCION: 'DEVOLUCION_VACIO',
  DEVOLUCION_VACIO: 'DEVOLUCION_VACIO',
};

const formatCapacity = (capacityKg: number | null): string =>
  capacityKg === null
    ? 'No registrada'
    : `${capacityKg.toLocaleString('es-CO')} kg · ${(capacityKg / 1000).toFixed(1)} Ton`;

const normalizeTractorAxles = (axles?: number | null): 2 | 3 | undefined =>
  axles === 2 || axles === 3 ? axles : undefined;
const normalizeTrailerAxles = (axles?: number | null): 1 | 2 | 3 | undefined =>
  axles === 1 || axles === 2 || axles === 3 ? axles : undefined;

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Fecha no disponible'
    : date.toLocaleString('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
};

const formatDate = (value?: string | Date | null) => {
  if (!value) return 'Sin fecha límite';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Fecha no disponible'
    : date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
};

const deadlineState = (
  deadline?: string | null,
  closedAt?: string | null,
  now = 0,
): DeadlineState => {
  if (closedAt) {
    if (!deadline) return 'closed';
    const deadlineTime = new Date(deadline).getTime();
    const closedTime = new Date(closedAt).getTime();
    return Number.isNaN(deadlineTime) || Number.isNaN(closedTime) ||
      closedTime <= deadlineTime
      ? 'closed'
      : 'overdue';
  }
  if (!deadline) return 'missing';
  const time = new Date(deadline).getTime();
  if (Number.isNaN(time)) return 'missing';
  const remaining = time - now;
  if (remaining < 0) return 'overdue';
  if (remaining <= 24 * 60 * 60 * 1000) return 'soon';
  return 'on-time';
};

const deadlineLabels: Record<DeadlineState, string> = {
  closed: 'Cumplido',
  overdue: 'Vencido / fuera de plazo',
  soon: 'Próximo a vencer',
  'on-time': 'Al día',
  missing: 'Sin fecha configurada',
};

const requestedAppointments = (operation: Operation): number[] =>
  [
    operation.scheduledAt,
    ...(operation.type !== 'NACIONAL'
      ? [operation.fechaCitaOrigen, operation.fechaCitaDestino]
      : []),
    ...(operation.isContainerized === true
      ? [operation.fechaCitaDesvio, operation.fechaRetiro]
      : []),
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value));

const hasPotentialOverlap = (
  operation: Operation,
  vehicle: FleetLiveVehicle,
): boolean => {
  if (!vehicle.appointmentAt) return false;
  const appointmentTime = new Date(vehicle.appointmentAt).getTime();
  if (!Number.isFinite(appointmentTime)) return false;
  return requestedAppointments(operation).some(
    (requestedTime) => Math.abs(requestedTime - appointmentTime) <= 60 * 60 * 1000,
  );
};

const getVehicleAxleCompatibility = (
  operation: Operation,
  vehicle: FleetLiveVehicle,
  trailer: FleetLiveTrailer | null,
) => {
  const configuration = operation.cargoVehicleType;
  const reasons: string[] = [];
  if (vehicle.axles !== 2 && vehicle.axles !== 3) {
    reasons.push('Ejes del cabezote sin registrar (se requieren 2 o 3)');
  }
  if (!configuration) {
    reasons.push('Configuración vehicular requerida no disponible');
  }
  if (configuration) {
    const emptyCargoOperation =
      operation.type === 'RETIRO_VACIO' ||
      operation.type === 'DEVOLUCION_VACIO';
    if (
      !emptyCargoOperation &&
      (operation.weight == null || operation.weight <= 0)
    ) {
      reasons.push('Peso de carga sin registrar');
    }
    if (
      configuration.tractorAxles !== null &&
      (vehicle.axles ?? 0) < configuration.tractorAxles
    ) {
      reasons.push(
        `Cabezote de ${vehicle.axles ?? 'ejes no registrados'}; se requieren al menos ${configuration.tractorAxles}`,
      );
    }

    if (configuration.requiresTrailer && !trailer) {
      reasons.push('La configuración requiere un tráiler');
    } else if (!configuration.requiresTrailer && trailer) {
      reasons.push('La configuración requiere un vehículo rígido sin tráiler');
    }

    if (
      trailer &&
      configuration.trailerAxles !== null &&
      configuration.trailerAxles > 0 &&
      (trailer.axles ?? 0) < configuration.trailerAxles
    ) {
      reasons.push(
        `Tráiler de ${trailer.axles ?? 'ejes no registrados'}; se requieren al menos ${configuration.trailerAxles}`,
      );
    }

    const actualConfigurationCode = getFleetConfigurationCode(
      vehicle.axles,
      trailer?.axles,
      vehicle.type,
    );
    if (!actualConfigurationCode) {
      reasons.push('No se pudo determinar una tipología oficial del equipo');
    }
    if (
      !configuration.requiresTrailer &&
      vehicle.type !== 'C2' &&
      vehicle.type !== 'C3'
    ) {
      reasons.push('Se requiere registrar un camión rígido C2 o C3');
    }

    if (operation.weight != null && operation.weight > 0) {
      const effectiveCapacity = vehicle.effectiveCapacityKg;
      if (effectiveCapacity === null) {
        reasons.push('Capacidad efectiva del equipo sin registrar');
      } else if (operation.weight > effectiveCapacity) {
        reasons.push(
          `La carga de ${operation.weight.toLocaleString('es-CO')} kg supera la capacidad efectiva de ${effectiveCapacity.toLocaleString('es-CO')} kg`,
        );
      }
    }
  }

  if (operation.requiredTrailerType) {
    if (!trailer) {
      reasons.push(
        `Se requiere un tráiler tipo ${TRAILER_TYPE_LABELS[operation.requiredTrailerType]}`,
      );
    } else if (trailer.trailerType !== operation.requiredTrailerType) {
      reasons.push(
        `Tráiler ${trailer.trailerType ? TRAILER_TYPE_LABELS[trailer.trailerType] : 'sin tipo'}; se requiere ${TRAILER_TYPE_LABELS[operation.requiredTrailerType]}`,
      );
    }
  }

  return {
    compatible: reasons.length === 0,
    reasons,
  };
};

const driverStatusLabel = (driver?: Driver): string => {
  if (!driver) return 'Conductor no disponible en el registro';
  if (driver.conductorStatus === 'BUSY') return 'Conductor con viaje activo';
  if (driver.conductorStatus === 'BLOCKED_BY_ABSENCE') return 'Conductor con ausencia';
  if (driver.conductorStatus === 'BLOCKED_BY_NOVEDAD') return 'Conductor bloqueado por novedad';
  return 'Conductor disponible';
};

export function OperationDispatchDrawer({
  operation: initialOperation,
  isAnalyst,
  onClose,
  onAssigned,
}: OperationDispatchDrawerProps) {
  const queryClient = useQueryClient();
  const operationQuery = useQuery({
    queryKey: ['operation', initialOperation?.id],
    queryFn: () => {
      if (!initialOperation) {
        throw new Error('No hay una operación seleccionada para despachar.');
      }
      return operationService.getOperationById(initialOperation.id);
    },
    enabled: Boolean(initialOperation?.id),
    initialData: initialOperation ?? undefined,
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const operation = operationQuery.data ?? initialOperation;
  const operationDetailsReady =
    operationQuery.isFetchedAfterMount &&
    !operationQuery.isFetching &&
    !operationQuery.isError;
  const [selectedTab, setSelectedTab] = useState<DispatchTab>('PROPIO');
  const activeTab: DispatchTab = isAnalyst ? 'TERCERO' : selectedTab;
  const [search, setSearch] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [now, setNow] = useState(0);
  const externalDispatchSchema = useMemo(
    () =>
      createExternalFleetDispatchSchema({
        tractorAxles: operation?.cargoVehicleType?.tractorAxles ?? null,
        requiresTrailer:
          operation?.cargoVehicleType?.requiresTrailer ?? false,
        trailerAxles: operation?.cargoVehicleType?.trailerAxles ?? null,
        requiredTrailerType: operation?.requiredTrailerType ?? null,
      }),
    [
      operation?.cargoVehicleType?.requiresTrailer,
      operation?.cargoVehicleType?.tractorAxles,
      operation?.cargoVehicleType?.trailerAxles,
      operation?.isContainerized,
      operation?.requiredTrailerType,
    ],
  );

  const liveQuery = useFleetLive(
    Boolean(operation) && !isAnalyst && activeTab === 'PROPIO',
  );
  const driversQuery = useQuery({
    queryKey: ['drivers', 'dispatch'],
    queryFn: driversService.getAll,
    enabled: Boolean(operation) && !isAnalyst && activeTab === 'PROPIO',
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000,
  });

  const externalForm = useForm<
    ExternalFleetDispatchInput,
    unknown,
    ExternalFleetDispatchValues
  >({
    resolver: zodResolver(externalDispatchSchema),
    mode: 'onChange',
    defaultValues: {
      plate: '',
      trailerPlate: '',
      tractorAxles: undefined,
      trailerType: undefined,
      trailerAxles: undefined,
      cargoCapacityKg: undefined,
      driverName: '',
      driverCedula: '',
      driverPhone: '',
      agreedFreight: '',
    },
  });
  const thirdPartyCapacityKg = useWatch({
    control: externalForm.control,
    name: 'cargoCapacityKg',
  });
  const externalDefaults = useMemo(
    () => ({
      plate: operation?.vehicle?.plate ?? '',
      trailerPlate: operation?.trailer?.plate ?? '',
      tractorAxles: normalizeTractorAxles(operation?.vehicle?.axles),
      trailerType: operation?.trailer?.trailerType ?? undefined,
      trailerAxles: normalizeTrailerAxles(operation?.trailer?.axles),
      cargoCapacityKg: operation?.vehicle?.cargoCapacity ?? undefined,
      driverName: operation?.driver?.name ?? '',
      driverCedula: operation?.driver?.cedula ?? '',
      driverPhone: operation?.driver?.telefono ?? '',
      agreedFreight:
        operation?.agreedFreight == null
          ? ''
          : String(operation.agreedFreight),
    }),
    [operation],
  );
  const resetExternalForm = externalForm.reset;

  useEffect(() => {
    resetExternalForm(externalDefaults);
  }, [externalDefaults, resetExternalForm]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const updateTime = () => {
      setNow(Date.now());
      timer = setTimeout(updateTime, 60_000);
    };
    timer = setTimeout(updateTime, 0);
    return () => clearTimeout(timer);
  }, []);

  const invalidateDispatchData = async (updatedOperation: Operation) => {
    queryClient.setQueryData(['trafico-detail', updatedOperation.id], updatedOperation);
    queryClient.setQueryData(['operation', updatedOperation.id], updatedOperation);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['operation', updatedOperation.id] }),
      queryClient.invalidateQueries({ queryKey: ['trafico'] }),
      queryClient.invalidateQueries({ queryKey: ['trafico-client-operations'] }),
      queryClient.invalidateQueries({ queryKey: ['operations'] }),
      queryClient.invalidateQueries({ queryKey: ['programacion'] }),
      queryClient.invalidateQueries({ queryKey: ['fleet-requests'] }),
      queryClient.invalidateQueries({ queryKey: ['operations', 'by-date'] }),
      queryClient.invalidateQueries({ queryKey: ['operations', 'pending-count'] }),
      queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['fleet-live-status'] }),
      queryClient.invalidateQueries({ queryKey: ['drivers'] }),
    ]);
    onAssigned?.(updatedOperation);
  };

  const ownFleetMutation = useMutation({
    mutationFn: ({
      operationId,
      vehicleId,
      force,
    }: {
      operationId: number;
      vehicleId: number;
      force?: boolean;
    }) => operationService.assignVehicle(operationId, vehicleId, force),
    onSuccess: invalidateDispatchData,
  });

  const ownReassignmentMutation = useMutation({
    mutationFn: ({
      operationId,
      data,
    }: {
      operationId: number;
      data: Parameters<typeof operationService.updateOperation>[1];
    }) => operationService.updateOperation(operationId, data),
    onSuccess: invalidateDispatchData,
  });

  const externalFleetMutation = useMutation({
    mutationFn: ({
      operationId,
      payload,
    }: {
      operationId: number;
      payload: AssignExternalResourcesPayload;
    }) => operationService.assignExternalResources(operationId, payload),
    onSuccess: invalidateDispatchData,
  });

  const driverById = useMemo(
    () => new Map((driversQuery.data ?? []).map((driver) => [driver.id, driver])),
    [driversQuery.data],
  );
  const operationDriverId = operation?.driverId;
  const operationAllowsRigidVehicle =
    !operation?.cargoVehicleType?.requiresTrailer &&
    !operation?.requiredTrailerType;
  const requiredTrailerType = operation?.requiredTrailerType;

  const vehicles = useMemo(() => {
    if (!liveQuery.data) return [];
    const ownVehicles = liveQuery.data.vehicles.filter(
      (vehicle) => vehicle.ownershipType === 'PROPIO',
    );
    const filtered = ownVehicles.filter((vehicle) => {
      const driver = vehicle.driverId
        ? driverById.get(vehicle.driverId)
        : undefined;
      const trailer = liveQuery.data?.trailers.find(
        (item) => item.id === vehicle.trailerId,
      );
      const query = search.trim().toLocaleLowerCase();
      const matchesSearch =
        !query ||
        vehicle.plate.toLocaleLowerCase().includes(query) ||
        (driver?.name ?? '').toLocaleLowerCase().includes(query) ||
        (trailer?.plate ?? '').toLocaleLowerCase().includes(query);
      const availableNow =
        (vehicle.status === 'AVAILABLE' || vehicle.status === 'ENDING_SOON') &&
        (driver?.isAvailable === true || driver?.id === operationDriverId) &&
        (operationAllowsRigidVehicle || Boolean(vehicle.trailerId));
      const matchesRequiredTrailerType =
        !requiredTrailerType ||
        trailer?.trailerType === requiredTrailerType;
      return (
        matchesSearch &&
        matchesRequiredTrailerType &&
        (!onlyAvailable || availableNow)
      );
    });
    return filtered;
  }, [
    driverById,
    liveQuery.data,
    onlyAvailable,
    operationAllowsRigidVehicle,
    operationDriverId,
    requiredTrailerType,
    search,
  ]);

  const getVehicleEligibility = (vehicle: FleetLiveVehicle) => {
    const driver = vehicle.driverId ? driverById.get(vehicle.driverId) : undefined;
    const trailer = liveQuery.data?.trailers.find(
      (item) => item.id === vehicle.trailerId,
    );
    const statusAvailable =
      vehicle.status === 'AVAILABLE' || vehicle.status === 'ENDING_SOON';
    const driverAvailable =
      driver?.isAvailable === true || driver?.id === operation?.driverId;
    const hasTrailer = Boolean(vehicle.trailerId && trailer);
    const requiresTrailer =
      Boolean(operation?.cargoVehicleType?.requiresTrailer) ||
      Boolean(operation?.requiredTrailerType);
    const hasRequiredTrailer = !requiresTrailer || hasTrailer;
    const compatibility = operation
      ? getVehicleAxleCompatibility(operation, vehicle, trailer ?? null)
      : { compatible: true, reasons: [] };
    return {
      driver,
      trailer,
      statusAvailable,
      driverAvailable,
      hasTrailer,
      hasRequiredTrailer,
      compatibility,
      canAssign:
        statusAvailable &&
        driverAvailable &&
        hasRequiredTrailer &&
        compatibility.compatible,
      overlap:
        operation && operation.vehicleId !== vehicle.id
          ? hasPotentialOverlap(operation, vehicle)
          : false,
    };
  };

  const assignOwnVehicle = async (vehicle: FleetLiveVehicle) => {
    if (!operation || !operationDetailsReady) return;
    try {
      if (operation.vehicleId || operation.status === 'ASIGNADO') {
        const eligibility = getVehicleEligibility(vehicle);
        if (!eligibility.driver || !eligibility.hasRequiredTrailer) return;
        await ownReassignmentMutation.mutateAsync({
          operationId: operation.id,
          data: {
            vehicleId: vehicle.id,
            driverId: eligibility.driver.id,
            trailerId: vehicle.trailerId,
          },
        });
      } else {
        await ownFleetMutation.mutateAsync({
          operationId: operation.id,
          vehicleId: vehicle.id,
        });
      }
      showToast.success('Flota propia asignada a la operación.');
    } catch (error) {
      const overlap =
        isAxiosError<BackendError>(error) &&
        error.response?.status === 409 &&
        error.response.data?.code === 'OVERLAPPING_APPOINTMENTS';
      if (overlap) {
        const confirmation = await Swal.fire({
          title: 'Cruce de citas',
          text:
            error.response?.data?.message ??
            'El vehículo tiene otra cita dentro de la ventana de ±60 minutos. ¿Deseas forzar la asignación?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, forzar asignación',
          cancelButtonText: 'Volver',
        });
        if (!confirmation.isConfirmed) return;
        try {
          await ownFleetMutation.mutateAsync({
            operationId: operation.id,
            vehicleId: vehicle.id,
            force: true,
          });
          showToast.success('Flota propia asignada a la operación.');
        } catch (forceError) {
          showToast.error(
            forceError,
            getUserFriendlyErrorMessage(
              forceError,
              'No se pudo asignar la flota seleccionada.',
            ),
          );
        }
        return;
      }
      showToast.error(
        error,
        getUserFriendlyErrorMessage(
          error,
          'No se pudo asignar la flota seleccionada.',
        ),
      );
    }
  };

  const assignExternalFleet = externalForm.handleSubmit(async (values) => {
    if (!operation || !operationDetailsReady) return;
    const payload: AssignExternalResourcesPayload = {
      plate: values.plate.trim().toLocaleUpperCase(),
      ...(values.trailerPlate.trim()
        ? { trailerPlate: values.trailerPlate.trim().toLocaleUpperCase() }
        : {}),
      ...(values.tractorAxles !== undefined
        ? { tractorAxles: values.tractorAxles }
        : {}),
      ...(values.trailerType ? { trailerType: values.trailerType } : {}),
      ...(values.trailerAxles !== undefined
        ? { trailerAxles: values.trailerAxles }
        : {}),
      ...(values.cargoCapacityKg !== undefined
        ? { cargoCapacityKg: values.cargoCapacityKg }
        : {}),
      driverName: values.driverName.trim(),
      driverCedula: values.driverCedula.trim(),
      driverPhone: values.driverPhone.replace(/\D/g, ''),
      agreedFreight: Number(values.agreedFreight),
    };
    try {
      await externalFleetMutation.mutateAsync({
        operationId: operation.id,
        payload,
      });
      showToast.success('Flota de tercero asignada a la operación.');
    } catch (error) {
      showToast.error(
        error,
        getUserFriendlyErrorMessage(
          error,
          'No se pudo asignar la flota de tercero.',
        ),
      );
    }
  });

  const documentaryState = deadlineState(
    operation?.fechaLimiteDocumental,
    operation?.fechaCierreDocumental,
    now,
  );
  const returnClosedAt =
    operation?.isContainerized === true &&
    operation.containerStatus === 'DEVUELTO_VACIO'
      ? operation.fechaCierreFisico
      : null;
  const physicalDeadline =
    operation?.fechaLimiteDevolucion ?? operation?.fechaLimiteFisico;
  const physicalClosure =
    operation?.isContainerized === true &&
    operation.type === 'IMPORTACION'
      ? returnClosedAt
      : operation?.fechaCierreFisico;
  const physicalState = deadlineState(
    physicalDeadline,
    physicalClosure,
    now,
  );
  const physicalDeadlineContext =
    operation?.type === 'EXPORTACION'
      ? 'Ingreso a puerto'
      : operation?.type === 'IMPORTACION' &&
          operation.isContainerized === true
        ? 'Devolución de vacío (patio vacío, propio o cliente)'
        : 'Entrega física en destino';

  const isSubmitting =
    ownFleetMutation.isPending ||
    ownReassignmentMutation.isPending ||
    externalFleetMutation.isPending;
  const { originName, destinationName } = getOperationRouteNames(operation);
  const appointment =
    operation?.type !== 'NACIONAL'
      ? operation?.fechaCitaOrigen ||
        operation?.fechaCitaDestino ||
        operation?.scheduledAt ||
        (operation?.isContainerized === true
          ? operation.fechaRetiro
          : null)
      : operation?.scheduledAt;
  const dispatcherTitle = operation
    ? `${isAnalyst ? 'Asignar tercero' : 'Asignar flota'} · Operación #${operation.id}`
    : 'Despacho de flota';

  return (
    <Drawer
      isOpen={Boolean(operation)}
      onClose={onClose}
      title={dispatcherTitle}
      className={styles.wideDrawer}
    >
      {operation && (
        <div className={styles.dispatchLayout}>
          <aside className={styles.contextPanel} aria-label="Contexto de la operación">
            {!operationDetailsReady && (
              <div
                className={
                  operationQuery.isError
                    ? styles.errorMessage
                    : styles.stateMessage
                }
                role={operationQuery.isError ? 'alert' : 'status'}
              >
                {operationQuery.isError
                  ? 'No se pudo cargar el detalle completo de la operación. La asignación está deshabilitada.'
                  : 'Cargando el detalle completo de la operación…'}
                {operationQuery.isError && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void operationQuery.refetch()}
                  >
                    Reintentar
                  </Button>
                )}
              </div>
            )}
            <div className={styles.operationHeading}>
              <span className={styles.operationCode}>#{operation.id}</span>
              <span className={styles.typeBadge}>
                {typeLabels[operation.type] ?? operation.type.replace(/_/g, ' ')}
              </span>
            </div>
            <h3 className={styles.clientName}>
              {operation.client?.razonSocial ?? 'Cliente sin nombre'}
            </h3>
            <p className={styles.route}>
              <span>{originName}</span>
              <span className={styles.routeArrow} aria-hidden="true">→</span>
              <span>{destinationName}</span>
            </p>
            <div className={styles.contextDetails}>
              <div className={styles.contextDetail}>
                <CalendarClock size={16} aria-hidden="true" />
                <span>
                  <strong>Cita / retiro</strong>
                  {formatDateTime(appointment)}
                </span>
              </div>
              <div className={styles.contextDetail}>
                <Truck size={16} aria-hidden="true" />
                <span>
                  <strong>Tipología requerida</strong>
                  {operation.cargoVehicleType?.name ??
                    'Configuración no disponible'}
                  {operation.cargoVehicleType?.maxPayloadKg != null
                    ? ` · Hasta ${operation.cargoVehicleType.maxPayloadKg.toLocaleString('es-CO')} kg`
                    : ''}
                </span>
              </div>
              <div className={styles.contextDetail}>
                <Truck size={16} aria-hidden="true" />
                <span>
                  <strong>Tipo de tráiler / carrocería requerido</strong>
                  {operation.requiredTrailerType
                    ? TRAILER_TYPE_LABELS[operation.requiredTrailerType]
                    : 'Cualquiera / sin restricción'}
                </span>
              </div>
              <div className={styles.contextDetail}>
                <span className={styles.sealIcon} aria-hidden="true">kg</span>
                <span>
                  <strong>Peso de la carga</strong>
                  {formatCapacity(operation.weight ?? null)}
                </span>
              </div>
              {operation.isContainerized === true ? (
                <>
                  <div className={styles.contextDetail}>
                    <Truck size={16} aria-hidden="true" />
                    <span>
                      <strong>Contenedor</strong>
                      {operation.containerNumber || 'Sin contenedor asociado'}
                    </span>
                  </div>
                  <div className={styles.contextDetail}>
                    <span className={styles.sealIcon} aria-hidden="true">#</span>
                    <span>
                      <strong>Sello / precinto</strong>
                      {operation.sealNumber || 'Sin sello registrado'}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.contextDetail}>
                    <span className={styles.sealIcon} aria-hidden="true">#</span>
                    <span>
                      <strong>Bultos / empaque</strong>
                      {`${operation.packageCount ?? '—'} · ${operation.packageType ?? 'Sin empaque'}`}
                    </span>
                  </div>
                  <div className={styles.contextDetail}>
                    <span className={styles.sealIcon} aria-hidden="true">m³</span>
                    <span>
                      <strong>Volumen / dimensiones</strong>
                      {`${operation.volumeM3 != null ? `${operation.volumeM3} m³` : 'Sin volumen'} · ${operation.dimensions || 'Sin dimensiones'}`}
                    </span>
                  </div>
                </>
              )}
            </div>

            <section className={styles.deadlines} aria-label="Fechas límite">
              <h4>Fechas límite</h4>
              <DeadlineIndicator
                label="Fecha Límite de Cierre Físico"
                date={physicalDeadline}
                state={physicalState}
                detail={physicalDeadlineContext}
              />
              <DeadlineIndicator
                label="Fecha Límite Documental"
                date={operation.fechaLimiteDocumental}
                state={documentaryState}
              />
            </section>
          </aside>

          <section className={styles.assignmentPanel} aria-label="Asignación de recursos">
            <div className={styles.tabs} role="tablist" aria-label="Tipo de flota">
              {!isAnalyst && (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'PROPIO'}
                  className={`${styles.tab} ${activeTab === 'PROPIO' ? styles.activeTab : ''}`}
                  onClick={() => setSelectedTab('PROPIO')}
                >
                  Flota propia
                </button>
              )}
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'TERCERO'}
                className={`${styles.tab} ${activeTab === 'TERCERO' ? styles.activeTab : ''}`}
                onClick={() => setSelectedTab('TERCERO')}
              >
                Flota de tercero
              </button>
            </div>

            {activeTab === 'PROPIO' && !isAnalyst ? (
              <div className={styles.ownFleet}>
                <div className={styles.searchControls}>
                  <label className={styles.searchInput}>
                    <Search size={16} aria-hidden="true" />
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Buscar placa o conductor"
                      aria-label="Buscar placa o conductor"
                    />
                  </label>
                  <label className={styles.availabilityFilter}>
                    <input
                      type="checkbox"
                      checked={onlyAvailable}
                      onChange={(event) => setOnlyAvailable(event.target.checked)}
                    />
                    Solo disponibles ahora
                  </label>
                </div>

                {!operationDetailsReady ? (
                  <div className={styles.stateMessage} role="status">
                    <LoaderCircle className={styles.spinner} size={19} />
                    Esperando el detalle de la operación…
                  </div>
                ) : liveQuery.isLoading || driversQuery.isLoading ? (
                  <div className={styles.stateMessage} role="status">
                    <LoaderCircle className={styles.spinner} size={19} />
                    Actualizando disponibilidad de flota…
                  </div>
                ) : liveQuery.isError || driversQuery.isError ? (
                  <div className={styles.errorMessage} role="alert">
                    No se pudo cargar toda la disponibilidad requerida para asignar.
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        if (liveQuery.isError) void liveQuery.refetch();
                        if (driversQuery.isError) void driversQuery.refetch();
                      }}
                    >
                      Reintentar
                    </Button>
                  </div>
                ) : vehicles.length === 0 ? (
                  <div className={styles.emptyState}>
                    No hay vehículos que coincidan con los filtros.
                  </div>
                ) : (
                  <div className={styles.vehicleList}>
                    {vehicles.map((vehicle) => {
                      const eligibility = getVehicleEligibility(vehicle);
                      const disabled =
                        !operationDetailsReady ||
                        !eligibility.canAssign ||
                        isSubmitting;
                      return (
                        <article key={vehicle.id} className={styles.vehicleCard}>
                          <div className={styles.vehicleHeader}>
                            <div>
                              <h3>{vehicle.plate}</h3>
                              <span className={`${styles.statusBadge} ${styles[vehicle.status]}`}>
                                {statusLabels[vehicle.status]}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="primary"
                              disabled={disabled}
                              isLoading={
                                ownFleetMutation.isPending ||
                                ownReassignmentMutation.isPending
                              }
                              onClick={() => void assignOwnVehicle(vehicle)}
                            >
                              Asignar
                            </Button>
                          </div>

                          <div className={styles.resourceDetails}>
                            <span>
                              <UserRound size={15} aria-hidden="true" />
                              {eligibility.driver?.name || 'Sin conductor vinculado'}
                            </span>
                            <span>
                              <Truck size={15} aria-hidden="true" />
                              {eligibility.trailer?.plate || 'Sin tráiler acoplado'}
                            </span>
                            <span>
                              <Truck size={15} aria-hidden="true" />
                              Vehículo: {vehicle.type} · Cabezote: {vehicle.axles ?? '—'} ejes · Tráiler:{' '}
                              {eligibility.trailer
                                ? `${eligibility.trailer.trailerType ? TRAILER_TYPE_LABELS[eligibility.trailer.trailerType] : 'Tipo sin registrar'} · ${eligibility.trailer.axles ?? '—'} ejes`
                                : 'no acoplado'}
                            </span>
                            <span>
                              <Truck size={15} aria-hidden="true" />
                              Configuración resultante:{' '}
                              {vehicle.configurationCode ?? 'Sin calcular'}
                            </span>
                            <span>
                              <Truck size={15} aria-hidden="true" />
                              Capacidad efectiva: {formatCapacity(vehicle.effectiveCapacityKg)}
                            </span>
                            <span>
                              <Truck size={15} aria-hidden="true" />
                              Carga: {formatCapacity(operation.weight ?? null)}
                            </span>
                            <span>
                              <Clock3 size={15} aria-hidden="true" />
                              Próxima cita: {formatDateTime(vehicle.appointmentAt)}
                            </span>
                          </div>

                          <div className={styles.eligibilityBadges} aria-label="Elegibilidad">
                            {!eligibility.statusAvailable && (
                              <span className={styles.badgeDanger}>
                                <AlertTriangle size={13} />
                                {statusLabels[vehicle.status]}
                              </span>
                            )}
                            {!eligibility.driverAvailable && (
                              <span className={styles.badgeDanger}>
                                <AlertTriangle size={13} />
                                {driverStatusLabel(eligibility.driver)}
                              </span>
                            )}
                            {!eligibility.hasRequiredTrailer && (
                              <span className={styles.badgeDanger}>
                                <AlertTriangle size={13} />
                                Falta tráiler requerido
                              </span>
                            )}
                            <span
                              className={
                                eligibility.compatibility.compatible
                                  ? styles.badgeSuccess
                                  : styles.badgeDanger
                              }
                            >
                              {eligibility.compatibility.compatible ? (
                                <CheckCircle2 size={13} />
                              ) : (
                                <AlertTriangle size={13} />
                              )}
                              {eligibility.compatibility.compatible
                                ? 'Compatible'
                                : `Incompatible: ${eligibility.compatibility.reasons.join('; ')}`}
                            </span>
                            {eligibility.overlap && (
                              <span className={styles.badgeWarning}>
                                <AlertTriangle size={13} />
                                Posible cruce de cita ±60 min; validación final al asignar
                              </span>
                            )}
                            {eligibility.canAssign && !eligibility.overlap && (
                              <span className={styles.badgeSuccess}>
                                <CheckCircle2 size={13} />
                                Elegible para esta asignación
                              </span>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <form className={styles.externalForm} onSubmit={assignExternalFleet} noValidate>
                <p className={styles.formIntro}>
                  Registra el vehículo, el conductor externo y el flete acordado para esta operación.
                </p>
                <div className={styles.externalFields}>
                  <FormField
                    label="Placa del vehículo"
                    error={externalForm.formState.errors.plate?.message}
                  >
                    <input
                      autoComplete="off"
                      {...externalForm.register('plate')}
                      aria-invalid={Boolean(externalForm.formState.errors.plate)}
                    />
                  </FormField>
                  <FormField
                    label={
                      operation.cargoVehicleType?.requiresTrailer ||
                      operation.requiredTrailerType
                        ? 'Placa de tráiler *'
                        : 'Placa de tráiler (opcional)'
                    }
                    error={externalForm.formState.errors.trailerPlate?.message}
                  >
                    <input
                      autoComplete="off"
                      {...externalForm.register('trailerPlate')}
                      aria-invalid={Boolean(externalForm.formState.errors.trailerPlate)}
                    />
                  </FormField>
                  <FormField
                    label="Ejes del cabezote *"
                    error={externalForm.formState.errors.tractorAxles?.message}
                  >
                    <select
                      {...externalForm.register('tractorAxles', {
                        setValueAs: (value: string) =>
                          value === '' ? undefined : Number(value),
                      })}
                      aria-invalid={Boolean(externalForm.formState.errors.tractorAxles)}
                    >
                      <option value="">Selecciona ejes</option>
                      <option value="2">2 ejes</option>
                      <option value="3">3 ejes</option>
                    </select>
                  </FormField>
                  <FormField
                        label={
                          operation.cargoVehicleType?.requiresTrailer ||
                          operation.requiredTrailerType
                            ? 'Tipo de tráiler *'
                            : 'Tipo de tráiler (opcional)'
                        }
                        error={externalForm.formState.errors.trailerType?.message}
                      >
                        <select
                          {...externalForm.register('trailerType')}
                          aria-invalid={Boolean(externalForm.formState.errors.trailerType)}
                        >
                          <option value="">Selecciona tipo</option>
                          {Object.entries(TRAILER_TYPE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                  </FormField>
                  <FormField
                        label={
                          operation.cargoVehicleType?.requiresTrailer ||
                          operation.requiredTrailerType
                            ? 'Ejes del tráiler *'
                            : 'Ejes del tráiler (opcional)'
                        }
                        error={externalForm.formState.errors.trailerAxles?.message}
                      >
                        <select
                          {...externalForm.register('trailerAxles', {
                            setValueAs: (value: string) =>
                              value === '' ? undefined : Number(value),
                          })}
                          aria-invalid={Boolean(externalForm.formState.errors.trailerAxles)}
                        >
                          <option value="">Selecciona ejes</option>
                          <option value="1">1 eje</option>
                          <option value="2">2 ejes</option>
                          <option value="3">3 ejes</option>
                        </select>
                  </FormField>
                  <FormField
                        label="Capacidad de carga (kg) · opcional"
                        error={externalForm.formState.errors.cargoCapacityKg?.message}
                      >
                        <input
                          type="number"
                          min="1"
                          step="1"
                          inputMode="numeric"
                          {...externalForm.register('cargoCapacityKg', {
                            setValueAs: (value: string) =>
                              value === '' ? undefined : Number(value),
                          })}
                          aria-invalid={Boolean(externalForm.formState.errors.cargoCapacityKg)}
                        />
                        {typeof thirdPartyCapacityKg === 'number' &&
                          thirdPartyCapacityKg > 0 && (
                            <small>
                              = {(thirdPartyCapacityKg / 1000).toFixed(1)} Ton
                            </small>
                          )}
                  </FormField>
                  <FormField
                    label="Nombre completo del conductor"
                    error={externalForm.formState.errors.driverName?.message}
                  >
                    <input
                      autoComplete="name"
                      {...externalForm.register('driverName')}
                      aria-invalid={Boolean(externalForm.formState.errors.driverName)}
                    />
                  </FormField>
                  <FormField
                    label="Cédula"
                    error={externalForm.formState.errors.driverCedula?.message}
                  >
                    <input
                      inputMode="numeric"
                      autoComplete="off"
                      {...externalForm.register('driverCedula')}
                      aria-invalid={Boolean(externalForm.formState.errors.driverCedula)}
                    />
                  </FormField>
                  <FormField
                    label="Teléfono"
                    error={externalForm.formState.errors.driverPhone?.message}
                  >
                    <input
                      type="tel"
                      autoComplete="tel"
                      {...externalForm.register('driverPhone')}
                      aria-invalid={Boolean(externalForm.formState.errors.driverPhone)}
                    />
                  </FormField>
                  <FormField
                    label="Flete acordado (COP)"
                    error={externalForm.formState.errors.agreedFreight?.message}
                  >
                    <input
                      type="number"
                      min="1"
                      step="1"
                      inputMode="decimal"
                      {...externalForm.register('agreedFreight')}
                      aria-invalid={Boolean(externalForm.formState.errors.agreedFreight)}
                    />
                  </FormField>
                </div>
                <div className={styles.formFooter}>
                  <Button type="submit" isLoading={externalFleetMutation.isPending}
                    disabled={
                      !operationDetailsReady ||
                      !externalForm.formState.isValid ||
                      externalFleetMutation.isPending
                    }>
                    Asignar flota de tercero
                  </Button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </Drawer>
  );
}

function DeadlineIndicator({
  label,
  date,
  state,
  detail,
}: {
  label: string;
  date?: string | null;
  state: DeadlineState;
  detail?: string;
}) {
  const Icon =
    state === 'closed' || state === 'on-time'
      ? CheckCircle2
      : state === 'missing'
        ? Clock3
        : AlertTriangle;
  return (
    <div className={`${styles.deadlineRow} ${styles[state]}`}>
      <Icon size={16} aria-hidden="true" />
      <span className={styles.deadlineText}>
        <strong>{label}</strong>
        <span>{formatDate(date)}{detail ? ` · ${detail}` : ''}</span>
      </span>
      <span className={styles.deadlineState}>{deadlineLabels[state]}</span>
    </div>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className={styles.formField}>
      <span>{label}</span>
      {children}
      {error && <span className={styles.fieldError} role="alert">{error}</span>}
    </label>
  );
}
