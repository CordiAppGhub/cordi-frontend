'use client';

import { useEffect, useState } from 'react';
import styles from './operation-traceability.module.css';

import { useTrafico } from '../../hooks/use-operations';
import type { Evidence, LogisticNode, Operation } from '@/types/operation-types';
import { useOperationTimeline } from '../../hooks/use-operation-timeline';
import { socket } from '@/lib/socket';
import { useQueryClient } from '@tanstack/react-query';
import { StatusBadge } from '@/components/atoms/badge.tsx/badge';
import { Button } from '@/components/atoms/button/button';
import { OperationTimeline } from '../timeline/operation-timeline';
import { EvidenceViewer, ImageViewer } from '@/components/organisms/evidence-viewer/evidence-viewer';
import { FileText, Activity, AlertTriangle, MapPin, Clock, Truck, Check, CheckCircle2, XCircle, RotateCcw, FileCheck, Download } from 'lucide-react'; 
import { TruckLoader } from '@/components/TruckLoader';
import { ContainerStatusLabels } from '@/constants/enum-mapping-types';
import { closeDocumentally, reviewEvidence, correctContainerState, operationService } from '@/services/operation.service';
import Swal from 'sweetalert2';
import { showToast } from '@/utils/alerts';
import { InspectionResult } from './inspection-result';
import { useAuthStore } from '@/store/use-auth.store';
import type { CargoStatus, OperationContainerStatus } from '@/types/driver-portal.types';

const containerPredecessors: Partial<Record<OperationContainerStatus, OperationContainerStatus[]>> = {
  EN_INSPECCION: ['PENDIENTE', 'EN_PISO'],
  EN_CARGUE: ['PENDIENTE', 'PENDIENTE_CARGUE', 'EN_INSPECCION'],
  CARGADO: ['EN_CARGUE'],
  EN_DESCARGUE: ['CARGADO'],
  DESCARGADO: ['EN_DESCARGUE'],
  EN_PISO: ['CARGADO', 'EN_DESCARGUE', 'DESCARGADO'],
  FALLA_REPORTADA: ['EN_INSPECCION', 'EN_CARGUE', 'EN_PISO'],
};

const cargoStates: CargoStatus[] = [
  'PENDIENTE', 'EN_CARGUE', 'CARGADO', 'SELLADO',
  'INSPECCIONADO', 'EN_DESCARGUE', 'DESCARGADO', 'DEVUELTO',
];
const requiredCargoState: Partial<Record<OperationContainerStatus, CargoStatus>> = {
  EN_INSPECCION: 'INSPECCIONADO',
  CARGADO: 'CARGADO',
  EN_DESCARGUE: 'CARGADO',
  DESCARGADO: 'DESCARGADO',
};

interface Props {
  operationId: number;
}

const DOCUMENT_RELATED_CONTAINER_TYPES = new Set([
  'EXPORTACION',
  'IMPORTACION',
  'RETIRO_VACIO',
  'DEVOLUCION_VACIO',
]);

type RoutePointRole = 'CARGUE' | 'DESCARGUE' | 'EMPTY_PICKUP' | 'EMPTY_RETURN';

interface TraceabilityRoutePoint {
  key: string;
  stopOrder: number;
  role: RoutePointRole;
  locationName: string;
  address?: string | null;
  locationId?: number | null;
  isPort?: boolean;
  isPatio?: boolean;
  appointmentAt?: string | null;
  actualArrivalAt?: string | null;
  actualDepartureAt?: string | null;
  clientName?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  observations?: string | null;
  cargoDescription?: string | null;
  weightKg?: number | null;
}

function getDocumentaryClosureMissingRequirements(operation: Operation): string[] {
  const missing: string[] = [];
  if (
    operation.type !== 'RETIRO_VACIO' &&
    operation.type !== 'DEVOLUCION_VACIO' &&
    !operation.documentoTransporte?.trim()
  ) {
    missing.push('Manifiesto / DO / BL');
  }
  if (
    operation.isContainerized === true &&
    DOCUMENT_RELATED_CONTAINER_TYPES.has(operation.type) &&
    !operation.containerNumber?.trim()
  ) {
    missing.push('Número de contenedor');
  }
  if (  operation.isContainerized === true && !operation.containerType) {
    missing.push('Tipo de contenedor');
  }

  const requiredEvidenceTypes = operation.isContainerized === true
    ? operation.type === 'EXPORTACION'
      ? [operation.amparosExportacion?.length ? 'INGRESO_PUERTO' : 'SALIDA_PUERTO']
      : operation.type === 'IMPORTACION' ||
          operation.type === 'DEVOLUCION_VACIO'
        ? ['TIRILLA_EIR']
        : ['Soporte de cierre']
    : [
        'DELIVERY_DOC',
        'FOTOS_LLEGADA_CARGA_SUELTA',
        'FOTOS_DESCARGUE_CARGA_SUELTA',
      ];
  for (const evidenceType of requiredEvidenceTypes) {
    if (
      !operation.evidences?.some(
        (evidence) =>
          evidence.type === evidenceType &&
          Boolean(evidence.url) &&
          !evidence.invalidated &&
          evidence.estadoRevision !== 'DEVUELTO',
      )
    ) {
      missing.push(`Archivo ${evidenceType.replace(/_/g, ' ')}`);
    }
  }
  return missing;
}

export function OperationTraceability({ operationId }: Props) {
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);
  const [displayedOperationId, setDisplayedOperationId] =
    useState(operationId);
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'evidences'>('details');
  const [isReviewing, setIsReviewing] = useState<number | null>(null);
  const [isClosingDocumentally, setIsClosingDocumentally] = useState(false);
  const [isCorrectingContainer, setIsCorrectingContainer] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const { currentOperation, isLoadingCurrent, fetchOperationById } = useTrafico();
  const { data: timelineEvents = [], isLoading: isLoadingTimeline } =
    useOperationTimeline(displayedOperationId);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    setDisplayedOperationId(operationId);
  }, [operationId]);

  useEffect(() => {
    if (!displayedOperationId) return;
    fetchOperationById(displayedOperationId);

    const updateEvent = `operation_${displayedOperationId}_updated`;
    const evidenceEvent = `operation_${displayedOperationId}_evidence`;

    const handleUpdate = (newData: Partial<Operation> & { isRollback?: boolean }) => {
      queryClient.setQueryData<Operation | undefined>(
        ['trafico-detail', displayedOperationId],
        (currentOperation) =>
          currentOperation ? { ...currentOperation, ...newData } : currentOperation,
      );
      queryClient.invalidateQueries({
        queryKey: ['operation-timeline', displayedOperationId],
      });
      if (newData.isRollback) {
        queryClient.invalidateQueries({
          queryKey: ['trafico-detail', displayedOperationId],
        });
      }
    };

    const handleNewEvidence = (newEvidence: Evidence) => {
      queryClient.setQueryData<Operation | undefined>(
        ['trafico-detail', displayedOperationId],
        (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          evidences: [...(oldData.evidences || []), newEvidence],
        };
        },
      );
      queryClient.invalidateQueries({
        queryKey: ['trafico-detail', displayedOperationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['operation-timeline', displayedOperationId],
      });
    };

    socket.on(updateEvent, handleUpdate);
    socket.on(evidenceEvent, handleNewEvidence);

    return () => {
      socket.off(updateEvent, handleUpdate);
      socket.off(evidenceEvent, handleNewEvidence);
    };
  }, [displayedOperationId, fetchOperationById, queryClient]);

  if (isLoadingCurrent) return <TruckLoader variant="compact" message="Cargando detalles de la operación..." />;
  if (!currentOperation) return <div className={styles.emptyState}>No se encontró la operación.</div>;

  // Lógica Financiera
  const fleteBase = Number(
    currentOperation.fleteACobrarManual ?? currentOperation.fleteACobrar ?? 0,
  );
  const recargos = currentOperation.surcharges || [];
  const totalCobrosExtras = Number(currentOperation.totalCobrosExtras ?? 0);
  const granTotalCobro = currentOperation.totalFacturacion;
  const fleteAPagar = Number(currentOperation.fleteAPagar || 0);

  // Lógica Gerencial: Alertas de Datos Faltantes
  const getMissingData = () => {
    const missing = [];
    if (!currentOperation.vehicleId) missing.push('Flota sin asignar');
    if (
      currentOperation.isContainerized === true &&
      !currentOperation.containerNumber &&
      (currentOperation.type === 'IMPORTACION' ||
        currentOperation.type === 'EXPORTACION')
    ) {
      missing.push('Falta el número de contenedor');
    }
    if (!currentOperation.documentoTransporte) missing.push('Falta manifiesto / documento de transporte');
    if (
      currentOperation.type !== 'NACIONAL' &&
      (currentOperation.isContainerized === true ||
        currentOperation.destino?.isPort === true) &&
      currentOperation.destino &&
      !currentOperation.fechaCitaDestino
    ) {
      missing.push('Destino asignado sin fecha de cita');
    }
    return missing;
  };
  const missingData = getMissingData();
  const documentaryClosureMissing =
    currentOperation.status === 'CIERRE_FISICO'
      ? getDocumentaryClosureMissingRequirements(currentOperation)
      : [];
  const canCloseDocumentally = ['ADMIN', 'JEFE_DE_FLOTA', 'ANALISTA'].includes(
    role ?? '',
  );
  const isDocumentaryClosurePending =
    currentOperation.status === 'CIERRE_FISICO' &&
    !currentOperation.fechaCierreDocumental;
  const containerStatus = currentOperation.containerStatus || 'PENDIENTE';
  const correctionStatus = Object.keys(containerPredecessors)
    .find((status): status is OperationContainerStatus => status === containerStatus);
  const possiblePreviousStates = correctionStatus
    ? containerPredecessors[correctionStatus] ?? []
    : [];
  const canCorrectContainer =
    currentOperation.isContainerized === true &&
    currentOperation.isActive &&
    !['CIERRE_FISICO', 'FINALIZADO', 'CANCELADO'].includes(currentOperation.status) &&
    ['ADMIN', 'JEFE_DE_FLOTA', 'ANALISTA'].includes(role || '') &&
    possiblePreviousStates.length > 0;
  const handleContainerCorrection = async () => {
    const expectedStatus = Object.keys(containerPredecessors)
      .find((status): status is OperationContainerStatus => status === containerStatus);
    if (!expectedStatus) return;
    const target = await Swal.fire<OperationContainerStatus>({
      title: 'Corregir estado del contenedor',
      text: 'Selecciona el paso anterior verificado. Revisa las evidencias antes de continuar; no se borrarán ni invalidarán automáticamente.',
      input: 'select',
      inputOptions: Object.fromEntries(possiblePreviousStates.map((status) => [status, status.replace(/_/g, ' ')])),
      inputPlaceholder: 'Selecciona el estado anterior',
      inputValidator: (value) => value ? undefined : 'Selecciona el estado anterior.',
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
    });
    if (!target.isConfirmed || !target.value || !possiblePreviousStates.includes(target.value)) return;
    const requiredCargo = requiredCargoState[target.value];
    const availableCargoStates = requiredCargo ? [requiredCargo] : cargoStates;
    const cargo = await Swal.fire<CargoStatus>({
      title: 'Estado real de la carga',
      text: 'Confirma el estado de carga que corresponde al paso anterior.',
      input: 'select',
      inputOptions: Object.fromEntries(availableCargoStates.map((status) => [status, status.replace(/_/g, ' ')])),
      inputValue: requiredCargo || '',
      inputPlaceholder: 'Selecciona el estado de carga',
      inputValidator: (value) => value ? undefined : 'Selecciona el estado de carga.',
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
    });
    if (!cargo.isConfirmed || !cargo.value || !availableCargoStates.includes(cargo.value)) return;
    const reason = await Swal.fire<string>({
      title: 'Motivo de la corrección',
      input: 'textarea',
      inputPlaceholder: 'Describe el error y cómo verificaste el estado real',
      inputValidator: (value) => value.trim().length >= 8 ? undefined : 'Escribe al menos 8 caracteres.',
      showCancelButton: true,
      confirmButtonText: 'Confirmar corrección',
      cancelButtonText: 'Cancelar',
    });
    if (!reason.isConfirmed || !reason.value?.trim()) return;
    setIsCorrectingContainer(true);
    try {
      await correctContainerState(displayedOperationId, {
        expectedStatus,
        targetStatus: target.value,
        cargoStatus: cargo.value,
        reason: reason.value.trim(),
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['trafico-detail', displayedOperationId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['operation-timeline', displayedOperationId],
        }),
      ]);
      showToast.success('Estado del contenedor corregido.');
    } finally {
      setIsCorrectingContainer(false);
    }
  };
  const isContainerStatusAlert = containerStatus === 'FALLA_REPORTADA';
  const isContainerStatusComplete =
    containerStatus === 'CARGADO' || containerStatus === 'DESCARGADO';
  const deviationNotice = currentOperation.historialNovedades?.find(
    (notice) => notice.metadata?.comodatoOcr,
  );
  const comodatoOcr = deviationNotice?.metadata?.comodatoOcr;
  const comodatoEvidences = currentOperation.evidences?.filter((evidence) =>
    evidence.type.toLowerCase().includes('comodato'),
  ) ?? [];
  const comodatoEvidenceUrls = new Set(
    comodatoEvidences.flatMap((evidence) => [
      evidence.url,
      ...(evidence.assets ?? []).map((asset) => asset.url),
    ]).filter((url): url is string => Boolean(url)),
  );
  const legacyComodatoUrls = (currentOperation.deviations ?? [])
    .map((deviation) => deviation.comodatoUrl)
    .filter((url) => Boolean(url) && !comodatoEvidenceUrls.has(url));
  const deviationDestination = currentOperation.nuevoDestino?.name;
  const deviationAppointment = currentOperation.fechaCitaDesvio;

  // Función para Fechas
  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleString('es-CO', {
      month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const getDeadlineStatus = (
    deadline?: string | Date | null,
    completedAt?: string | Date | null,
  ): 'ontime' | 'upcoming' | 'overdue' | null => {
    if (!deadline) return null;
    const deadlineTime = new Date(deadline).getTime();
    if (Number.isNaN(deadlineTime)) return null;
    if (completedAt) {
      const completionTime = new Date(completedAt).getTime();
      if (!Number.isNaN(completionTime)) {
        return completionTime <= deadlineTime ? 'ontime' : 'overdue';
      }
    }
    const remaining = deadlineTime - Date.now();
    if (remaining < 0) return 'overdue';
    if (remaining <= 3 * 24 * 60 * 60 * 1000) return 'upcoming';
    return 'ontime';
  };

  const getDeadlineLabel = (status: ReturnType<typeof getDeadlineStatus>) => {
    if (status === 'ontime') return 'Al día';
    if (status === 'upcoming') return 'Próximo a vencer';
    if (status === 'overdue') return 'Vencido';
    return 'Sin fecha límite';
  };

  const linkedReturnOperation = currentOperation.childOperations?.find(
    (childOperation) => childOperation.type === 'DEVOLUCION_VACIO',
  );
  const relatedParentId = currentOperation.relatedOperationId;
  const returnClosureDate =
    currentOperation.type === 'DEVOLUCION_VACIO'
      ? currentOperation.fechaCierreFisico
      : linkedReturnOperation
        ? linkedReturnOperation.fechaCierreFisico
        : currentOperation.containerStatus === 'EN_PISO'
          ? null
          : currentOperation.fechaCierreFisico;
  const physicalDeadline =
    currentOperation.fechaLimiteDevolucion ??
    currentOperation.fechaLimiteFisico;
  const physicalClosure =
    currentOperation.type === 'IMPORTACION' &&
    currentOperation.isContainerized === true
        ? returnClosureDate
        : currentOperation.fechaCierreFisico;
  const isExportOperation =
    currentOperation.type === 'EXPORTACION' ||
    currentOperation.type === 'EXPORTACION_ANTICIPADA' ||
    (currentOperation.type === 'EXPORTACION' &&
      currentOperation.isAnticipada === true);
  const physicalDeadlineContext = isExportOperation
    ? 'Ingreso a puerto'
    : currentOperation.type === 'IMPORTACION' &&
        currentOperation.isContainerized === true
      ? 'Devolución de vacío'
      : 'Entrega en destino';
  const isAppointmentOperation = [
    'IMPORTACION',
    'EXPORTACION',
    'EXPORTACION_ANTICIPADA',
  ].includes(currentOperation.type) ||
    (currentOperation.type === 'DEVOLUCION_VACIO' &&
      currentOperation.isContainerized === true);
  const makeFallbackPoint = (
    role: RoutePointRole,
    location: LogisticNode | null | undefined,
    stopOrder: number,
  ): TraceabilityRoutePoint | null =>
    location
      ? {
          key: `fallback-${role}-${location.id}`,
          stopOrder,
          role,
          locationName: location.name,
          address: location.address,
          locationId: location.id,
          isPort: location.isPort,
          isPatio: location.isDepot || location.isOwnYard,
        }
      : null;
  const storedRoutePoints: TraceabilityRoutePoint[] = [
    ...(currentOperation.stops ?? []),
  ]
    .sort((left, right) => left.stopOrder - right.stopOrder)
    .map((stop) => {
      const locationId = stop.locationId;
      const isPatio =
        stop.location?.isDepot === true ||
        stop.location?.isOwnYard === true ||
        stop.clientLocation?.isDepot === true ||
        (currentOperation.patioId != null &&
          locationId === currentOperation.patioId) ||
        (currentOperation.depositoDevolucionId != null &&
          locationId === currentOperation.depositoDevolucionId);
      const isEmptyReturn =
        currentOperation.isContainerized === true &&
        stop.stopType === 'DESCARGUE' &&
        (currentOperation.type === 'DEVOLUCION_VACIO' ||
          (currentOperation.depositoDevolucionId != null &&
            locationId === currentOperation.depositoDevolucionId) ||
          (currentOperation.type === 'IMPORTACION' &&
            currentOperation.patioId != null &&
            locationId === currentOperation.patioId));

      return {
        key: `stop-${stop.id ?? stop.stopOrder}`,
        stopOrder: stop.stopOrder,
        role: isEmptyReturn ? 'EMPTY_RETURN' : stop.stopType,
        locationName:
          stop.clientLocation?.name ||
          stop.location?.name ||
          stop.address ||
          `Ubicación de parada ${stop.stopOrder + 1}`,
        address: stop.address || stop.location?.address,
        locationId,
        isPort: stop.location?.isPort,
        isPatio,
        appointmentAt: stop.appointmentAt,
        actualArrivalAt: stop.actualArrivalAt,
        actualDepartureAt: stop.actualDepartureAt,
        clientName: stop.client?.razonSocial,
        contactName: stop.contactName,
        contactPhone: stop.contactPhone,
        observations: stop.observations,
        cargoDescription: stop.cargoDescription,
        weightKg: stop.weightKg,
      };
    });
  const fallbackRoutePoints: TraceabilityRoutePoint[] = [];
  if (
    currentOperation.isContainerized === true &&
    isExportOperation &&
    currentOperation.patio
  ) {
    const emptyPickup = makeFallbackPoint(
      'EMPTY_PICKUP',
      currentOperation.patio,
      fallbackRoutePoints.length,
    );
    if (emptyPickup) fallbackRoutePoints.push(emptyPickup);
  }
  const fallbackOrigin = isExportOperation
    ? currentOperation.cargue || currentOperation.origen
    : currentOperation.type === 'IMPORTACION'
      ? currentOperation.origen || currentOperation.cargue
      : currentOperation.cargue || currentOperation.origen;
  const originPoint = makeFallbackPoint(
    'CARGUE',
    fallbackOrigin,
    fallbackRoutePoints.length,
  );
  if (originPoint) fallbackRoutePoints.push(originPoint);

  const fallbackDestination =
    currentOperation.type === 'DEVOLUCION_VACIO'
      ? currentOperation.depositoDevolucion ||
        currentOperation.destino ||
        currentOperation.patio
      : currentOperation.type === 'IMPORTACION'
        ? currentOperation.descargue || currentOperation.destino
        : currentOperation.destino || currentOperation.descargue;
  const destinationPoint = makeFallbackPoint(
    currentOperation.type === 'DEVOLUCION_VACIO' &&
      currentOperation.isContainerized === true
      ? 'EMPTY_RETURN'
      : 'DESCARGUE',
    fallbackDestination,
    fallbackRoutePoints.length,
  );
  if (destinationPoint) fallbackRoutePoints.push(destinationPoint);

  const routePoints =
    storedRoutePoints.length > 0 ? [...storedRoutePoints] : fallbackRoutePoints;
  if (
    currentOperation.isContainerized === true &&
    isExportOperation &&
    currentOperation.patio &&
    !routePoints.some((point) => point.locationId === currentOperation.patio?.id)
  ) {
    const emptyPickup = makeFallbackPoint(
      'EMPTY_PICKUP',
      currentOperation.patio,
      -1,
    );
    if (emptyPickup) routePoints.unshift(emptyPickup);
  }
  if (
    currentOperation.isContainerized === true &&
    currentOperation.type === 'IMPORTACION'
  ) {
    const returnLocation =
      currentOperation.depositoDevolucion || currentOperation.patio;
    const alreadyIncluded = routePoints.some(
      (point) => point.locationId === returnLocation?.id,
    );
    if (returnLocation && !alreadyIncluded) {
      const returnPoint = makeFallbackPoint(
        'EMPTY_RETURN',
        returnLocation,
        routePoints.length,
      );
      if (returnPoint) routePoints.push(returnPoint);
    }
  }
  routePoints.sort((left, right) => left.stopOrder - right.stopOrder);
  routePoints.forEach((point, index) => {
    point.stopOrder = index;
  });
  const firstLoadingPoint = routePoints.find(
    (point) => point.role === 'CARGUE',
  );
  const lastUnloadingPoint = [...routePoints]
    .reverse()
    .find((point) => point.role === 'DESCARGUE');
  const tripMilestones = [
    { label: 'Creada', value: currentOperation.createdAt },
    { label: 'Programada', value: currentOperation.scheduledAt },
    { label: 'Inicio de ruta', value: currentOperation.horaInicio },
    {
      label: 'Finalización del viaje',
      value: currentOperation.horaFinal ?? currentOperation.fechaCierreFisico,
    },
    ...(currentOperation.fechaAsignacion
      ? [{ label: 'Asignación', value: currentOperation.fechaAsignacion }]
      : []),
  ];

  const handleDownloadEvidencePdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const blob = await operationService.getEvidencePdf(displayedOperationId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `operacion-${displayedOperationId}-evidencias.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      showToast.error(error, 'No se pudo descargar el PDF de evidencias.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const formatTimestampRange = (
    start?: string | null,
    end?: string | null,
  ) => {
    if (start && end) return `${formatDate(start)} — ${formatDate(end)}`;
    if (start) return `${formatDate(start)} — Fin sin registrar`;
    if (end) return `Inicio sin registrar — ${formatDate(end)}`;
    return 'Sin registro';
  };

  const formatElapsedMinutes = (
    start?: string | null,
    end?: string | null,
  ) => {
    if (!start || !end) return 'Duración no disponible';
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
      return 'Duración no disponible';
    }
    return `${Math.max(0, Math.round((endTime - startTime) / 60000))} min`;
  };

  const handleApprove = async (evidenceId: number) => {
    let notaAnalista: string | undefined;
    const evidence = currentOperation.evidences?.find((item) => item.id === evidenceId);
    if (evidence?.ocrResult) {
      const result = await Swal.fire({
        title: 'Aprobar lectura OCR',
        text: 'Indica el motivo de la aprobación manual.',
        input: 'textarea',
        showCancelButton: true,
        confirmButtonText: 'Aprobar',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => value?.trim() ? null : 'Debes ingresar el motivo.',
      });
      if (!result.isConfirmed || !result.value?.trim()) return;
      notaAnalista = result.value.trim();
    }
    try {
      setIsReviewing(evidenceId);
      await reviewEvidence(evidenceId, { estadoRevision: 'APROBADO', notaAnalista });
      showToast.success('Soporte aprobado correctamente');
      queryClient.setQueryData<Operation | undefined>(
        ['trafico-detail', displayedOperationId],
        (oldData) => {
          if (!oldData || !oldData.evidences) return oldData;
          return {
            ...oldData,
            evidences: oldData.evidences.map((ev) =>
              ev.id === evidenceId ? { ...ev, estadoRevision: 'APROBADO' as const, notaAnalista } : ev,
            ),
          };
        },
      );
      queryClient.invalidateQueries({
        queryKey: ['trafico-detail', displayedOperationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['operation-timeline', displayedOperationId],
      });
    } catch {
      showToast.error('No se pudo aprobar el soporte');
    } finally {
      setIsReviewing(null);
    }
  };

  const handleReject = async (evidenceId: number) => {
    const result = await Swal.fire({
      title: 'Devolver Soporte',
      text: 'Indica al conductor el motivo de devolución o qué debe corregir:',
      input: 'textarea',
      inputPlaceholder: 'Ej: Foto ilegible o falta el sello con claridad...',
      showCancelButton: true,
      confirmButtonText: 'Devolver soporte',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      inputValidator: (val) => {
        if (!val || !val.trim()) {
          return 'Debes ingresar una observación para el conductor';
        }
        return null;
      },
    });

    if (result.isConfirmed && result.value) {
      try {
        setIsReviewing(evidenceId);
        const notaAnalista = result.value.trim();
        await reviewEvidence(evidenceId, {
          estadoRevision: 'DEVUELTO',
          notaAnalista,
        });
        showToast.success('Soporte devuelto con observaciones');
        queryClient.setQueryData<Operation | undefined>(
          ['trafico-detail', displayedOperationId],
          (oldData) => {
            if (!oldData || !oldData.evidences) return oldData;
            return {
              ...oldData,
              evidences: oldData.evidences.map((ev) =>
                ev.id === evidenceId ? { ...ev, estadoRevision: 'DEVUELTO' as const, notaAnalista } : ev,
              ),
            };
          },
        );
        queryClient.invalidateQueries({
          queryKey: ['trafico-detail', displayedOperationId],
        });
        queryClient.invalidateQueries({
          queryKey: ['operation-timeline', displayedOperationId],
        });
      } catch {
        showToast.error('No se pudo devolver el soporte');
      } finally {
        setIsReviewing(null);
      }
    }
  };

  const handleDocumentaryClosure = async () => {
    if (
      !canCloseDocumentally ||
      documentaryClosureMissing.length > 0 ||
      isClosingDocumentally
    ) {
      return;
    }
    const confirmation = await Swal.fire({
      title: 'Aprobar cierre documental',
      text: 'Al aprobar el cierre documental, la operación quedará finalizada y pasará al historial.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Aprobar cierre documental',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#15803d',
    });
    if (!confirmation.isConfirmed) return;

    setIsClosingDocumentally(true);
    try {
      const updatedOperation = await closeDocumentally(displayedOperationId);
      queryClient.setQueryData<Operation | undefined>(
        ['trafico-detail', displayedOperationId],
        (oldOperation) =>
          oldOperation
            ? { ...oldOperation, ...updatedOperation }
            : updatedOperation,
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['trafico-detail', displayedOperationId],
        }),
        queryClient.invalidateQueries({ queryKey: ['trafico'] }),
        queryClient.invalidateQueries({ queryKey: ['trafico-client-operations'] }),
        queryClient.invalidateQueries({ queryKey: ['operations'] }),
        queryClient.invalidateQueries({ queryKey: ['operations', 'by-date'] }),
        queryClient.invalidateQueries({ queryKey: ['operation-history'] }),
        queryClient.invalidateQueries({
          queryKey: ['dashboard', 'operation-alerts'],
        }),
      ]);
      showToast.success(
        'Cierre documental aprobado. La operación quedó finalizada.',
      );
    } catch (error: unknown) {
      showToast.error(error, 'No se pudo aprobar el cierre documental.');
    } finally {
      setIsClosingDocumentally(false);
    }
  };

  const renderEvidenceBadge = (estado?: string) => {
    switch (estado) {
      case 'APROBADO':
        return (
          <span className={styles.badgeReviewApproved}>
            <CheckCircle2 size={12} /> Aprobado
          </span>
        );
      case 'DEVUELTO':
        return (
          <span className={styles.badgeReviewRejected}>
            <XCircle size={12} /> Devuelto
          </span>
        );
      default:
        return (
          <span className={styles.badgeReviewPending}>
            <Clock size={12} /> Pendiente
          </span>
        );
    }
  };

  const evidencesCount = currentOperation.evidences?.length || 0;

  return (
    <div className={styles.wrapper}>
      
      {/* 🚀 SELECTOR DE PESTAÑAS (TABS) SUPERIOR */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveTab('details')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
            borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
            backgroundColor: activeTab === 'details' ? '#2563eb' : '#f1f5f9',
            color: activeTab === 'details' ? '#ffffff' : '#64748b', transition: 'all 0.2s',
          }}
        >
          <FileText size={16} />
          Ficha Técnica y Detalles
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
            borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
            backgroundColor: activeTab === 'timeline' ? '#2563eb' : '#f1f5f9',
            color: activeTab === 'timeline' ? '#ffffff' : '#64748b', transition: 'all 0.2s',
          }}
        >
          <Activity size={16} />
          Trazabilidad Forense ({timelineEvents.length})
        </button>

        <button
          onClick={() => setActiveTab('evidences')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
            borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
            backgroundColor: activeTab === 'evidences' ? '#2563eb' : '#f1f5f9',
            color: activeTab === 'evidences' ? '#ffffff' : '#64748b', transition: 'all 0.2s',
          }}
        >
          <FileCheck size={16} />
          Soportes y Evidencias ({evidencesCount})
        </button>
      </div>

      {/* 🚀 VISTA 1: FICHA TÉCNICA (Con la estructura mejorada) */}
      {activeTab === 'details' && (
        <div className={styles.card}>
          
          {/* Cabecera del Documento */}
          <div className={styles.detailHero}>
            <div>
              <h2 className={styles.detailHeroTitle}>
                {currentOperation.client?.razonSocial || 'CLIENTE GENERAL'}
              </h2>
              <p className={styles.detailHeroMeta}>
                Operación #{currentOperation.id} · {currentOperation.type}
                {currentOperation.client?.nit ? ` · NIT ${currentOperation.client.nit}` : ''}
                {currentOperation.analyst?.name
                  ? ` · Analista: ${currentOperation.analyst.name}`
                  : ''}
              </p>
            </div>
            <StatusBadge status={currentOperation.status} />
          </div>

          {/* ALERTAS (Lo que falta) */}
          {missingData.length > 0 && (
            <div className={styles.alertBox}>
              <div className={styles.alertHeader}>
                <AlertTriangle size={18} />
                Alertas Operativas (Datos Incompletos)
              </div>
              <ul className={styles.alertList}>
                {missingData.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <section className={styles.detailSection}>
            <h3 className={styles.sectionTitle}>
              <MapPin size={18} color="#64748b" /> Ruta y Trazabilidad por Ubicación
            </h3>
            {routePoints.length > 0 ? (
              <ol className={styles.traceabilityStops}>
                {routePoints.map((point) => {
                  const roleLabel =
                    point.role === 'CARGUE'
                      ? 'Cargue / Origen'
                      : point.role === 'DESCARGUE'
                        ? 'Descargue / Destino'
                        : point.role === 'EMPTY_PICKUP'
                          ? 'Retiro de vacío'
                          : 'Devolución de vacío';
                  const isFirstLoadingPoint =
                    point.key === firstLoadingPoint?.key;
                  const isLastUnloadingPoint =
                    point.key === lastUnloadingPoint?.key;
                  const appointmentRelevant =
                    isAppointmentOperation &&
                    (currentOperation.isContainerized === true
                      ? point.role === 'EMPTY_PICKUP' ||
                        point.role === 'EMPTY_RETURN' ||
                        point.isPatio === true ||
                        ((point.role === 'CARGUE' && isFirstLoadingPoint) ||
                          (point.role === 'DESCARGUE' &&
                            isLastUnloadingPoint))
                      : point.isPort === true);
                  const appointmentDate =
                    point.appointmentAt ??
                    (point.role === 'EMPTY_PICKUP'
                      ? currentOperation.fechaRetiro
                      : point.role === 'EMPTY_RETURN'
                        ? currentOperation.type === 'DEVOLUCION_VACIO'
                          ? currentOperation.fechaCitaDestino ??
                            currentOperation.fechaCitaDesvio
                          : currentOperation.fechaCitaDesvio
                        : point.isPatio &&
                            currentOperation.isContainerized === true
                          ? currentOperation.fechaRetiro
                          : point.role === 'CARGUE'
                            ? currentOperation.fechaCitaOrigen
                            : currentOperation.fechaCitaDestino);
                  const arrivalFallback =
                    point.role === 'EMPTY_RETURN'
                      ? currentOperation.horaAtencion ??
                        returnClosureDate
                      : point.role === 'CARGUE' && isFirstLoadingPoint
                        ? currentOperation.horaLlegada
                        : point.role === 'DESCARGUE' &&
                            isLastUnloadingPoint
                          ? isExportOperation
                            ? currentOperation.horaLlegada
                            : currentOperation.horaAtencion ??
                              currentOperation.horaLlegada
                          : null;
                  const departureFallback =
                    point.role === 'EMPTY_RETURN'
                      ? returnClosureDate
                      : point.role === 'CARGUE' && isFirstLoadingPoint
                        ? currentOperation.horaSalida
                        : point.role === 'DESCARGUE' &&
                            isLastUnloadingPoint
                          ? currentOperation.horaFinal ??
                            currentOperation.fechaCierreFisico
                          : null;
                  const arrivalAt =
                    point.actualArrivalAt ?? arrivalFallback;
                  const departureAt =
                    point.actualDepartureAt ?? departureFallback;
                  const loadingStart = isFirstLoadingPoint
                    ? currentOperation.loadingStartedAt ??
                      currentOperation.horaCargue
                    : null;
                  const loadingEnd = isFirstLoadingPoint
                    ? currentOperation.loadingCompletedAt
                    : null;
                  const unloadingStart = isLastUnloadingPoint
                    ? currentOperation.unloadingStartedAt ??
                      currentOperation.horaDescargue
                    : null;
                  const unloadingEnd = isLastUnloadingPoint
                    ? currentOperation.unloadingCompletedAt
                    : null;

                  return (
                    <li className={styles.traceabilityStop} key={point.key}>
                      <header className={styles.traceabilityStopHeader}>
                        <span className={styles.routeStopOrder}>
                          {point.stopOrder + 1}
                        </span>
                        <div>
                          <span className={styles.traceabilityStopRole}>
                            Parada {point.stopOrder + 1} · {roleLabel}
                          </span>
                          <strong>{point.locationName}</strong>
                          {point.address && <small>{point.address}</small>}
                          {point.clientName && <small>{point.clientName}</small>}
                          {point.contactName && (
                            <small>Contacto: {point.contactName}</small>
                          )}
                          {point.contactPhone && (
                            <small>Teléfono: {point.contactPhone}</small>
                          )}
                          {point.observations && (
                            <small>{point.observations}</small>
                          )}
                        </div>
                      </header>

                      {appointmentRelevant && (
                        <p className={styles.stopAppointment}>
                          <Clock size={14} aria-hidden="true" />
                          <span>
                            Cita programada en {point.locationName}:{' '}
                            {appointmentDate
                              ? formatDate(appointmentDate)
                              : 'Sin cita programada'}
                          </span>
                        </p>
                      )}

                      <div className={styles.stopTimeline}>
                        <div className={styles.stopTimelineItem}>
                          <span>Llegada a {point.locationName}</span>
                          <strong>
                            {arrivalAt ? formatDate(arrivalAt) : 'Sin registrar'}
                          </strong>
                        </div>
                        {point.role === 'CARGUE' && (
                          <div className={styles.stopTimelineItem}>
                            <span>Cargue en {point.locationName}</span>
                            <strong>
                              {formatTimestampRange(loadingStart, loadingEnd)}
                            </strong>
                            <small>
                              Duración: {formatElapsedMinutes(loadingStart, loadingEnd)}
                            </small>
                          </div>
                        )}
                        {point.role === 'DESCARGUE' && (
                          <div className={styles.stopTimelineItem}>
                            <span>Descargue en {point.locationName}</span>
                            <strong>
                              {formatTimestampRange(unloadingStart, unloadingEnd)}
                            </strong>
                            <small>
                              Duración:{' '}
                              {formatElapsedMinutes(unloadingStart, unloadingEnd)}
                            </small>
                          </div>
                        )}
                        <div className={styles.stopTimelineItem}>
                          <span>
                            {point.role === 'CARGUE'
                              ? `Salida de ${point.locationName}`
                              : point.role === 'EMPTY_RETURN'
                                ? `Entrega de vacío en ${point.locationName}`
                                : point.role === 'EMPTY_PICKUP'
                                  ? `Retiro de vacío en ${point.locationName}`
                                  : `Salida / Entrega en ${point.locationName}`}
                          </span>
                          <strong>
                            {departureAt
                              ? formatDate(departureAt)
                              : 'Sin registrar'}
                          </strong>
                        </div>
                      </div>

                      {(point.cargoDescription || point.weightKg != null) && (
                        <div className={styles.stopCargoDetails}>
                          {point.cargoDescription && (
                            <span>{point.cargoDescription}</span>
                          )}
                          {point.weightKg != null && (
                            <span>
                              {Number(point.weightKg).toLocaleString('es-CO')} kg
                            </span>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className={styles.emptyRoute}>
                No hay ubicaciones de ruta registradas.
              </p>
            )}

            {currentOperation.isContainerized === true &&
              (currentOperation.containerStatus === 'PENDIENTE_DEVOLUCION' ||
                currentOperation.nuevoDestinoId ||
                deviationNotice) && (
                <div className={styles.deviationTrace}>
                  <h4>Desvío / devolución</h4>
                  <p>
                    {currentOperation.destino?.name ||
                      currentOperation.descargue?.name ||
                      'Destino original'}
                    {' → '}
                    {deviationDestination || 'Pendiente de confirmación'}
                  </p>
                  <small>
                    Cita programada en {deviationDestination || 'destino confirmado'}:{' '}
                    {deviationAppointment
                      ? formatDate(deviationAppointment)
                      : 'Sin cita programada'}
                  </small>
                  {comodatoOcr && (
                    <div className={styles.gridAuto}>
                      <div>
                        <span className={styles.label}>
                          Lectura IA del comodato
                        </span>
                        <p className={styles.value}>
                          {comodatoOcr.legible
                            ? 'Lectura disponible; requiere confirmación del analista'
                            : 'No se pudo leer el comodato automáticamente'}
                        </p>
                      </div>
                      {comodatoOcr.destino && (
                        <div>
                          <span className={styles.label}>
                            Destino sugerido por el documento
                          </span>
                          <p className={styles.value}>{comodatoOcr.destino}</p>
                        </div>
                      )}
                      {comodatoOcr.fechaCita && (
                        <div>
                          <span className={styles.label}>
                            Cita indicada en el documento
                          </span>
                          <p className={styles.value}>{comodatoOcr.fechaCita}</p>
                        </div>
                      )}
                      {comodatoOcr.numeroContenedor && (
                        <div>
                          <span className={styles.label}>Contenedor leído</span>
                          <p className={styles.value}>
                            {comodatoOcr.numeroContenedor}
                          </p>
                        </div>
                      )}
                      {comodatoOcr.referencia && (
                        <div>
                          <span className={styles.label}>Referencia</span>
                          <p className={styles.value}>{comodatoOcr.referencia}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {comodatoEvidences.map((evidence) => (
                    <div key={evidence.id}>
                      <span className={styles.label}>Soportes adjuntos</span>
                      <EvidenceViewer evidence={evidence} />
                    </div>
                  ))}
                  {legacyComodatoUrls.map((url) => (
                    <div key={url}>
                      <span className={styles.label}>Soporte legado</span>
                      <EvidenceViewer evidence={{ type: 'COMODATO', url }} />
                    </div>
                  ))}
                </div>
              )}

            <div className={styles.tripMilestones}>
              {tripMilestones.map((milestone) => (
                <div className={styles.tripMilestone} key={milestone.label}>
                  <span>{milestone.label}</span>
                  <strong>
                    {milestone.value
                      ? formatDate(milestone.value)
                      : 'Pendiente'}
                  </strong>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.detailSection}>
            <h3 className={styles.sectionTitle}>
              <Clock size={18} color="#64748b" /> Fechas Límite
            </h3>
            <div className={styles.deadlineGrid}>
              <div className={styles.deadlineCard}>
                <span className={styles.label}>Fecha Límite Documental</span>
                <strong className={styles.value}>
                  {formatDate(currentOperation.fechaLimiteDocumental)}
                </strong>
                {currentOperation.diasLibresDocumental != null && (
                  <small>
                    {currentOperation.diasLibresDocumental} días libres documentales
                  </small>
                )}
                <span
                  className={`${styles.deadlineBadge} ${styles[`deadline_${getDeadlineStatus(currentOperation.fechaLimiteDocumental, currentOperation.fechaCierreDocumental) ?? 'none'}`]}`}
                >
                  {getDeadlineLabel(
                    getDeadlineStatus(
                      currentOperation.fechaLimiteDocumental,
                      currentOperation.fechaCierreDocumental,
                    ),
                  )}
                </span>
              </div>
              <div className={styles.deadlineCard}>
                <span className={styles.label}>
                  Fecha Límite de Cierre Físico
                </span>
                <strong className={styles.value}>
                  {formatDate(physicalDeadline)}
                </strong>
                <small>{physicalDeadlineContext}</small>
                <span
                  className={`${styles.deadlineBadge} ${styles[`deadline_${getDeadlineStatus(physicalDeadline, physicalClosure) ?? 'none'}`]}`}
                >
                  {getDeadlineLabel(
                    getDeadlineStatus(physicalDeadline, physicalClosure),
                  )}
                </span>
              </div>
            </div>
          </section>

          <section className={styles.detailSection}>
            <h3 className={styles.sectionTitle}>
              <Truck size={18} color="#64748b" /> Equipo y Mercancía
            </h3>

            <div className={styles.detailSubsection}>
              <h4>Equipo asignado</h4>
              <div className={styles.detailGrid}>
                <div className={styles.infoBlock}>
                  <span className={styles.label}>Vehículo</span>
                  <strong className={styles.value}>
                    {currentOperation.placaIA ||
                      currentOperation.vehicle?.plate ||
                      'Sin asignar'}
                  </strong>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.label}>Tráiler / Chasis</span>
                  <strong className={styles.value}>
                    {currentOperation.trailer?.plate || 'Sin asignar'}
                  </strong>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.label}>Conductor asignado</span>
                  <strong className={styles.value}>
                    {currentOperation.driver?.name || 'Sin asignar'}
                  </strong>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.label}>
                    Configuración vehicular requerida
                  </span>
                  <strong className={styles.value}>
                    {currentOperation.cargoVehicleType?.name ||
                      currentOperation.vehicleType?.name ||
                      'No especificada'}
                  </strong>
                </div>
              </div>
            </div>

            <div className={styles.detailSubsection}>
              <h4>Detalle de la carga</h4>
              <div className={styles.detailGrid}>
                {currentOperation.isContainerized === true ? (
                  <>
                    <div className={styles.infoBlock}>
                      <span className={styles.label}>
                        Tipo y N.º de contenedor
                      </span>
                      <strong className={styles.value}>
                        {currentOperation.containerType || 'Tipo sin registrar'}
                        {' · '}
                        {currentOperation.containerNumber ||
                          'Número sin registrar'}
                      </strong>
                    </div>
                    <div className={styles.infoBlock}>
                      <span className={styles.label}>Línea naviera</span>
                      <strong className={styles.value}>
                        {currentOperation.shippingLine?.name || 'Sin asignar'}
                      </strong>
                    </div>
                    <div className={styles.infoBlock}>
                      <span className={styles.label}>
                        Inspección de naviera
                      </span>
                      <strong className={styles.value}>
                        {!currentOperation.requiresInspection
                          ? 'No requerida'
                          : currentOperation.inspectionStatus === 'APROBADO'
                            ? 'Aprobada'
                            : currentOperation.inspectionStatus
                              ? 'Rechazada'
                              : 'Pendiente'}
                      </strong>
                    </div>
                    <div className={styles.infoBlock}>
                      <span className={styles.label}>Días libres</span>
                      <strong className={styles.value}>
                        {currentOperation.diasLibresDevolucion != null
                          ? `${currentOperation.diasLibresDevolucion} días`
                          : 'Sin registrar'}
                      </strong>
                    </div>
                    <div className={styles.infoBlock}>
                      <span className={styles.label}>Peso (kg)</span>
                      <strong className={styles.value}>
                        {(currentOperation.peso ?? currentOperation.weight) != null
                          ? `${Number(currentOperation.peso ?? currentOperation.weight).toLocaleString('es-CO')} kg`
                          : 'Sin registrar'}
                      </strong>
                    </div>
                    {currentOperation.containerStatus && (
                      <div className={styles.infoBlock}>
                        <span className={styles.label}>Estado del contenedor</span>
                        <strong
                          className={styles.containerStatusBadge}
                          style={{
                            backgroundColor: isContainerStatusAlert
                              ? '#fee2e2'
                              : isContainerStatusComplete
                                ? '#dcfce7'
                                : '#e0f2fe',
                            color: isContainerStatusAlert
                              ? '#b91c1c'
                              : isContainerStatusComplete
                                ? '#15803d'
                                : '#0369a1',
                          }}
                        >
                          {ContainerStatusLabels[containerStatus] ||
                            containerStatus.replace(/_/g, ' ')}
                        </strong>
                        {canCorrectContainer && (
                          <button
                            type="button"
                            className={styles.btnViewEvidence}
                            disabled={isCorrectingContainer}
                            onClick={() =>
                              void handleContainerCorrection().catch(
                                (error: unknown) =>
                                  showToast.error(
                                    error,
                                    'No se pudo corregir el contenedor.',
                                  ),
                              )
                            }
                          >
                            <RotateCcw size={14} /> Corregir estado del
                            contenedor
                          </button>
                        )}
                        {currentOperation.containerIssueDescription && (
                          <small className={styles.dateSub}>
                            Falla reportada:{' '}
                            {currentOperation.containerIssueDescription}
                          </small>
                        )}
                        {currentOperation.containerStatusUpdatedAt && (
                          <small className={styles.dateSub}>
                            Último reporte:{' '}
                            {formatDate(currentOperation.containerStatusUpdatedAt)}
                          </small>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className={styles.infoBlock}>
                      <span className={styles.label}>Tipo de carga</span>
                      <strong className={styles.value}>
                        SUELTA
                      </strong>
                    </div>
                    {currentOperation.requiredTrailerType && (
                      <div className={styles.infoBlock}>
                        <span className={styles.label}>
                          Tipo de tráiler requerido
                        </span>
                        <strong className={styles.value}>
                          {currentOperation.requiredTrailerType}
                        </strong>
                      </div>
                    )}
                    <div className={styles.infoBlock}>
                      <span className={styles.label}>Peso (kg)</span>
                      <strong className={styles.value}>
                        {currentOperation.weight != null
                          ? `${Number(currentOperation.weight).toLocaleString('es-CO')} kg`
                          : 'Sin registrar'}
                      </strong>
                    </div>
                    <div className={styles.infoBlock}>
                      <span className={styles.label}>Descripción de carga</span>
                      <strong className={styles.value}>
                        {currentOperation.cargoDescription || 'Sin registrar'}
                      </strong>
                    </div>
                    {currentOperation.packageType && (
                      <div className={styles.infoBlock}>
                        <span className={styles.label}>Empaque</span>
                        <strong className={styles.value}>
                          {currentOperation.packageType}
                        </strong>
                      </div>
                    )}
                    {currentOperation.packageCount != null && (
                      <div className={styles.infoBlock}>
                        <span className={styles.label}>Bultos</span>
                        <strong className={styles.value}>
                          {currentOperation.packageCount}
                        </strong>
                      </div>
                    )}
                    {currentOperation.dimensions && (
                      <div className={styles.infoBlock}>
                        <span className={styles.label}>Dimensiones</span>
                        <strong className={styles.value}>
                          {currentOperation.dimensions}
                        </strong>
                      </div>
                    )}
                    {currentOperation.volumeM3 != null && (
                      <div className={styles.infoBlock}>
                        <span className={styles.label}>Volumen</span>
                        <strong className={styles.value}>
                          {Number(currentOperation.volumeM3).toLocaleString(
                            'es-CO',
                          )}{' '}
                          m³
                        </strong>
                      </div>
                    )}
                  </>
                )}
              </div>
              {currentOperation.isContainerized === true && (
                <InspectionResult operation={currentOperation} />
              )}
            </div>
          </section>

          <section className={styles.detailSection}>
            <h3 className={styles.sectionTitle}>
              <Activity size={18} color="#64748b" /> Liquidación Financiera
            </h3>
            <div className={`${styles.infoBlock} ${styles.financialSummary}`}>
              <div className={styles.financialList}>
                <div className={styles.financialRow}>
                  <span>
                    Flete a cobrar
                    {currentOperation.fleteACobrarManual != null
                      ? ' (manual)'
                      : ''}
                  </span>
                  <strong>
                    {currentOperation.fleteACobrarManual != null ||
                    currentOperation.fleteACobrar != null
                      ? `$ ${fleteBase.toLocaleString('es-CO')}`
                      : 'Pendiente'}
                  </strong>
                </div>

                {recargos.length > 0 ? (
                  recargos.map((surcharge) => (
                    <div className={styles.financialRow} key={surcharge.id}>
                      <span className={styles.surchargeDescription}>
                        <span>
                          <strong>
                            {surcharge.surcharge?.name || surcharge.surchargeCode}
                          </strong>
                          {surcharge.quantity > 1
                            ? ` · ${surcharge.quantity} unid.`
                            : ''}
                        </span>
                        {surcharge.observations && (
                          <small>{surcharge.observations}</small>
                        )}
                        {surcharge.novedad && (
                          <small>
                            Novedad #{surcharge.novedad.id}
                            {surcharge.novedad.category
                              ? ` · ${surcharge.novedad.category.replaceAll('_', ' ')}`
                              : ''}
                          </small>
                        )}
                        {Number(surcharge.costPrice) > 0 && (
                          <small>
                            Costo proveedor: ${' '}
                            {Number(surcharge.costPrice).toLocaleString('es-CO')}
                          </small>
                        )}
                      </span>
                      <strong>
                        Venta: ${' '}
                        {Number(surcharge.totalPrice).toLocaleString('es-CO')}
                      </strong>
                    </div>
                  ))
                ) : (
                  <div className={styles.financialRow}>
                    <span>Novedades y recargos</span>
                    <strong>—</strong>
                  </div>
                )}

                <div className={styles.financialRow}>
                  <span>Total cobros extra</span>
                  <strong>
                    $ {totalCobrosExtras.toLocaleString('es-CO')}
                  </strong>
                </div>
                <div className={styles.financialRow}>
                  <span>Flete a pagar (Flota)</span>
                  <strong>
                    {currentOperation.fleteAPagar == null
                      ? 'Pendiente'
                      : `$ ${fleteAPagar.toLocaleString('es-CO')}`}
                  </strong>
                </div>
                <div className={styles.financialRow}>
                  <span>Retención de flota</span>
                  <strong>
                    {currentOperation.retencionFlotaPorcentaje == null
                      ? '—'
                      : `${Number(currentOperation.retencionFlotaPorcentaje).toLocaleString('es-CO')} %`}
                  </strong>
                </div>
                <div className={styles.totalRow}>
                  <span>Total cobro cliente</span>
                  <strong>
                    {granTotalCobro == null
                      ? 'Pendiente'
                      : `$ ${Number(granTotalCobro).toLocaleString('es-CO')}`}
                  </strong>
                </div>
              </div>
              <strong className={styles.grossProfit}>
                Rentabilidad bruta:{' '}
                {currentOperation.rentabilidadBruta == null
                  ? 'Pendiente de pago de flota'
                  : `$ ${currentOperation.rentabilidadBruta.toLocaleString('es-CO')}`}
              </strong>
            </div>
          </section>

          {/* DOCUMENTOS */}
          <div>
            <h3 className={styles.sectionTitle}>
              <FileText size={18} color="#64748b" /> Documentación
            </h3>
            
            <div className={styles.gridAuto}>
              <div className={styles.infoBlock}>
                <span className={styles.label}>Número de Pedido / Booking</span>
                <strong className={styles.value}>{currentOperation.numeroPedido || '--'}</strong>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.label}>Manifiesto / DO</span>
                <strong className={styles.value}>{currentOperation.documentoTransporte || '--'}</strong>
              </div>
              {currentOperation.isContainerized === true && (
                <div className={styles.infoBlock}>
                  <span className={styles.label}>Precinto (Seal)</span>
                  <strong className={styles.value}>{currentOperation.sealNumber || '---'}</strong>
                </div>
              )}
              <div className={styles.infoBlock}>
                <span className={styles.label}>ARIN</span>
                <strong className={styles.value}>{currentOperation.arin || '---'}</strong>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.label}>Radicado</span>
                <strong className={styles.value}>{currentOperation.radicado || '---'}</strong>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.label}>Cumplido</span>
                <strong className={styles.value}>{currentOperation.cumplido || '---'}</strong>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.label}>Cierre físico</span>
                <strong className={styles.value}>{formatDate(currentOperation.fechaCierreFisico)}</strong>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.label}>Cierre documental</span>
                <strong className={styles.value}>{formatDate(currentOperation.fechaCierreDocumental)}</strong>
              </div>
            </div>
            {currentOperation.isContainerized === true &&
              currentOperation.containerStatus === 'EN_PISO' && (
              <div
                className={
                  linkedReturnOperation
                    ? styles.returnProgramNotice
                    : styles.returnProgramWarning
                }
                role={linkedReturnOperation ? 'status' : 'alert'}
              >
                {linkedReturnOperation ? (
                  <>
                    <span>
                      Devolución de vacío vinculada: operación #
                      {linkedReturnOperation.id}
                      {linkedReturnOperation.fechaCierreFisico
                        ? ` · cierre físico ${formatDate(linkedReturnOperation.fechaCierreFisico)}`
                        : ' · pendiente de cierre físico'}
                    </span>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        setDisplayedOperationId(linkedReturnOperation.id)
                      }
                    >
                      Ver devolución #{linkedReturnOperation.id}
                    </Button>
                  </>
                ) : (
                  <span>
                    El contenedor está en piso y todavía no tiene una operación
                    DEVOLUCION_VACIO vinculada.
                    {currentOperation.fechaLimiteDevolucion
                      ? ` Límite de devolución: ${formatDate(currentOperation.fechaLimiteDevolucion)}.`
                      : ''}
                  </span>
                )}
              </div>
            )}
            {currentOperation.isContainerized === true &&
              currentOperation.type === 'DEVOLUCION_VACIO' &&
              relatedParentId && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setDisplayedOperationId(relatedParentId)}
                >
                  Volver a operación padre #
                  {relatedParentId}
                </Button>
              )}
            {currentOperation.observaciones && (
              <div className={styles.infoBlock}>
                <span className={styles.label}>Observaciones</span>
                <p className={styles.value}>{currentOperation.observaciones}</p>
              </div>
            )}
            {currentOperation.novedades && (
              <div className={styles.infoBlock}>
                <span className={styles.label}>Novedades</span>
                <p className={styles.value}>{currentOperation.novedades}</p>
              </div>
            )}
          </div>

          {canCloseDocumentally && isDocumentaryClosurePending && (
            <section className={styles.documentaryClosure}>
              <h3 className={styles.sectionTitle}>
                <FileCheck size={18} color="#64748b" /> Cierre documental pendiente
              </h3>
              {documentaryClosureMissing.length > 0 && (
                <div className={styles.documentaryClosureWarning} role="alert">
                  <strong>No se puede finalizar todavía. Falta:</strong>
                  <ul>
                    {documentaryClosureMissing.map((requirement) => (
                      <li key={requirement}>{requirement}</li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                type="button"
                className={styles.documentaryClosureButton}
                disabled={
                  documentaryClosureMissing.length > 0 ||
                  isClosingDocumentally
                }
                onClick={() => void handleDocumentaryClosure()}
              >
                {isClosingDocumentally
                  ? 'Aprobando cierre...'
                  : 'Aprobar Cierre Documental'}
              </button>
            </section>
          )}

          {/* 📸 SOPORTES Y EVIDENCIAS DENTRO DE FICHA TÉCNICA */}
          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 className={styles.sectionTitle} style={{ borderBottom: 'none', margin: 0, padding: 0 }}>
                <FileCheck size={18} color="#64748b" /> Soportes y Evidencias del Viaje ({evidencesCount})
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('evidences')}
                className={styles.btnViewEvidence}
              >
                Abrir Galería Completa
              </button>
              <button
                type="button"
                onClick={() => void handleDownloadEvidencePdf()}
                className={styles.btnViewEvidence}
                disabled={isDownloadingPdf}
              >
                <Download size={15} />
                {isDownloadingPdf ? 'Generando PDF…' : 'Descargar PDF Evidencias'}
              </button>
            </div>

            {currentOperation.evidences && currentOperation.evidences.length > 0 ? (
              <div className={styles.evidenceGrid}>
                {currentOperation.evidences.map((ev) => {
                  return (
                    <div key={ev.id} className={styles.evidenceCard}>
                      <div className={styles.evidenceHeader}>
                        <div>
                          <span className={styles.evidenceType}>{ev.type || 'Soporte'}</span>
                          <div className={styles.evidenceMeta}>
                            {ev.etapa && (
                              <span>
                                Etapa: <strong>{ev.etapa}</strong>
                              </span>
                            )}
                            <span>Fecha: {formatDate(ev.createdAt)}</span>
                          </div>
                        </div>
                        {ev.invalidated ? <span className={styles.evidenceType}>Invalidada</span> : renderEvidenceBadge(ev.estadoRevision)}
                      </div>

                      <EvidenceViewer evidence={ev} />

                      {ev.notaAnalista && (
                        <div className={styles.analystNoteBox}>
                          <strong>Motivo de devolución:</strong>
                          <p style={{ margin: '2px 0 0 0' }}>{ev.notaAnalista}</p>
                        </div>
                      )}

                      <div className={styles.evidenceActions}>
                        <button
                          type="button"
                          className={styles.btnApprove}
                          disabled={ev.invalidated || isReviewing === ev.id || ev.estadoRevision === 'APROBADO'}
                          onClick={() => handleApprove(ev.id)}
                          title="Aprobar soporte"
                        >
                          <Check size={14} />
                          {ev.estadoRevision === 'APROBADO' ? 'Aprobado' : 'Aprobar'}
                        </button>

                        <button
                          type="button"
                          className={styles.btnReject}
                          disabled={ev.invalidated || isReviewing === ev.id}
                          onClick={() => handleReject(ev.id)}
                          title="Devolver soporte con observaciones"
                        >
                          <RotateCcw size={14} />
                          Devolver
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyState} style={{ padding: '24px 16px', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{ margin: 0, color: '#64748b' }}>No se han subido soportes para esta operación.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 🚀 VISTA 2: TRAZABILIDAD FORENSE (Mantenida intacta) */}
      {activeTab === 'timeline' && (
        <div className={styles.card}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
            Historial y Auditoría en Vivo
          </h3>
          
          {isLoadingTimeline ? (
            <TruckLoader variant="compact" message="Cargando historial de la operación..." />
          ) : (
            <OperationTimeline 
              events={timelineEvents} 
              onViewImage={(url: string) => setSelectedImage(url)} 
            />
          )}
        </div>
      )}

      {/* 🚀 VISTA 3: GALERÍA Y REVISIÓN DE SOPORTES */}
      {activeTab === 'evidences' && (
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Galería y Revisión de Soportes
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>
                Revisa, aprueba o devuelve las evidencias cargadas por el conductor o el analista.
              </p>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2563eb', backgroundColor: '#eff6ff', padding: '4px 12px', borderRadius: '999px' }}>
              {evidencesCount} {evidencesCount === 1 ? 'soporte' : 'soportes'}
            </span>
          </div>

          {currentOperation.evidences && currentOperation.evidences.length > 0 ? (
            <div className={styles.evidenceGrid}>
              {currentOperation.evidences.map((ev) => {
                return (
                  <div key={ev.id} className={styles.evidenceCard}>
                    <div className={styles.evidenceHeader}>
                      <div>
                        <span className={styles.evidenceType}>{ev.type || 'Soporte'}</span>
                        <div className={styles.evidenceMeta}>
                          {ev.etapa && (
                            <span>
                              Etapa: <strong>{ev.etapa}</strong>
                            </span>
                          )}
                          <span>Fecha: {formatDate(ev.createdAt)}</span>
                        </div>
                      </div>
                      {ev.invalidated ? <span className={styles.evidenceType}>Invalidada</span> : renderEvidenceBadge(ev.estadoRevision)}
                    </div>

                    <EvidenceViewer evidence={ev} />

                    {ev.notaAnalista && (
                      <div className={styles.analystNoteBox}>
                        <strong>Motivo de devolución:</strong>
                        <p style={{ margin: '2px 0 0 0' }}>{ev.notaAnalista}</p>
                      </div>
                    )}

                    <div className={styles.evidenceActions}>
                      <button
                        type="button"
                        className={styles.btnApprove}
                        disabled={ev.invalidated || isReviewing === ev.id || ev.estadoRevision === 'APROBADO'}
                        onClick={() => handleApprove(ev.id)}
                        title="Aprobar soporte"
                      >
                        <Check size={14} />
                        {ev.estadoRevision === 'APROBADO' ? 'Aprobado' : 'Aprobar'}
                      </button>

                      <button
                        type="button"
                        className={styles.btnReject}
                        disabled={ev.invalidated || isReviewing === ev.id}
                        onClick={() => handleReject(ev.id)}
                        title="Devolver soporte con observaciones"
                      >
                        <RotateCcw size={14} />
                        Devolver
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState} style={{ padding: '40px 16px' }}>
              <FileCheck size={44} color="#cbd5e1" style={{ margin: '0 auto 8px' }} />
              <p style={{ margin: 0, fontWeight: 700, color: '#475569' }}>
                No se han registrado soportes para esta operación
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Los soportes subidos por el conductor o el analista se mostrarán aquí para su revisión.
              </p>
            </div>
          )}
        </div>
      )}

      {/* MODAL / VISOR DE IMÁGENES */}
      {selectedImage && (
        <ImageViewer images={[selectedImage]} index={0} label="Evidencia del historial" onClose={() => setSelectedImage(null)} onIndexChange={() => {}} />
      )}

    </div>
  );
}