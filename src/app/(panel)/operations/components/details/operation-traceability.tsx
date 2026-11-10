'use client';

import React, { useEffect, useState } from 'react';
import styles from './operation-traceability.module.css';

import { useTrafico } from '../../hooks/use-operations';
import { Evidence, Operation } from '@/types/operation-types';
import { useOperationTimeline } from '../../hooks/use-operation-timeline';
import { socket } from '@/lib/socket';
import { useQueryClient } from '@tanstack/react-query';
import { StatusBadge } from '@/components/atoms/badge.tsx/badge';
import { OperationTimeline } from '../timeline/operation-timeline';
import { EvidenceViewer, ImageViewer } from '@/components/organisms/evidence-viewer/evidence-viewer';
import { FileText, Activity, AlertTriangle, MapPin, Clock, Truck, Check, CheckCircle2, XCircle, RotateCcw, FileCheck } from 'lucide-react'; 
import { TruckLoader } from '@/components/TruckLoader';
import { ContainerStatusLabels } from '@/constants/enum-mapping-types';
import { closeDocumentally, reviewEvidence, correctContainerState } from '@/services/operation.service';
import Swal from 'sweetalert2';
import { showToast } from '@/utils/alerts';
import { InspectionResult } from './inspection-result';
import { formatAppointmentLocationLabel } from '@/utils/appointment-label';
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
    operation.isContainerized &&
    DOCUMENT_RELATED_CONTAINER_TYPES.has(operation.type) &&
    !operation.containerNumber?.trim()
  ) {
    missing.push('Número de contenedor');
  }
  if (operation.isContainerized && !operation.containerType) {
    missing.push('Tipo de contenedor');
  }

  const requiredEvidenceTypes = operation.isContainerized
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
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'evidences'>('details');
  const [isReviewing, setIsReviewing] = useState<number | null>(null);
  const [isClosingDocumentally, setIsClosingDocumentally] = useState(false);
  const [isCorrectingContainer, setIsCorrectingContainer] = useState(false);

  const { currentOperation, isLoadingCurrent, fetchOperationById } = useTrafico();
  const { data: timelineEvents = [], isLoading: isLoadingTimeline } = useOperationTimeline(operationId);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!operationId) return;
    fetchOperationById(operationId);

    const updateEvent = `operation_${operationId}_updated`;
    const evidenceEvent = `operation_${operationId}_evidence`;

    const handleUpdate = (newData: Partial<Operation> & { isRollback?: boolean }) => {
      queryClient.setQueryData<Operation | undefined>(
        ['trafico-detail', operationId],
        (currentOperation) =>
          currentOperation ? { ...currentOperation, ...newData } : currentOperation,
      );
      queryClient.invalidateQueries({ queryKey: ['operation-timeline', operationId] });
      if (newData.isRollback) {
        queryClient.invalidateQueries({ queryKey: ['trafico-detail', operationId] });
      }
    };

    const handleNewEvidence = (newEvidence: Evidence) => {
      queryClient.setQueryData<Operation | undefined>(['trafico-detail', operationId], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          evidences: [...(oldData.evidences || []), newEvidence],
        };
      });
      queryClient.invalidateQueries({
        queryKey: ['trafico-detail', operationId],
      });
      queryClient.invalidateQueries({ queryKey: ['operation-timeline', operationId] });
    };

    socket.on(updateEvent, handleUpdate);
    socket.on(evidenceEvent, handleNewEvidence);

    return () => {
      socket.off(updateEvent, handleUpdate);
      socket.off(evidenceEvent, handleNewEvidence);
    };
  }, [operationId, fetchOperationById, queryClient]);

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
      currentOperation.isContainerized &&
      !currentOperation.containerNumber &&
      (currentOperation.type === 'IMPORTACION' ||
        currentOperation.type === 'EXPORTACION')
    ) {
      missing.push('Falta el número de contenedor');
    }
    if (!currentOperation.documentoTransporte) missing.push('Falta manifiesto / documento de transporte');
    if (currentOperation.destino && !currentOperation.fechaCitaDestino) missing.push('Destino asignado sin fecha de cita');
    return missing;
  };
  const missingData = getMissingData();
  const documentaryClosureMissing =
    currentOperation.status === 'CIERRE_FISICO'
      ? getDocumentaryClosureMissingRequirements(currentOperation)
      : [];
  const containerStatus = currentOperation.containerStatus || 'PENDIENTE';
  const correctionStatus = Object.keys(containerPredecessors)
    .find((status): status is OperationContainerStatus => status === containerStatus);
  const possiblePreviousStates = correctionStatus
    ? containerPredecessors[correctionStatus] ?? []
    : [];
  const canCorrectContainer =
    currentOperation.isContainerized &&
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
      await correctContainerState(operationId, {
        expectedStatus,
        targetStatus: target.value,
        cargoStatus: cargo.value,
        reason: reason.value.trim(),
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['trafico-detail', operationId] }),
        queryClient.invalidateQueries({ queryKey: ['operation-timeline', operationId] }),
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
  const deviationDestination = currentOperation.nuevoDestino?.name;
  const deviationAppointment = currentOperation.fechaCitaDesvio;

  // Función para Fechas
  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleString('es-CO', {
      month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const formatDuration = (start?: string | null, end?: string | null) => {
    if (!start) return 'Sin iniciar';
    if (!end) return 'En curso';
    const totalMinutes = Math.max(
      0,
      Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000),
    );
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours ? `${hours} h ${minutes} min` : `${minutes} min`;
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
        ['trafico-detail', operationId],
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
      queryClient.invalidateQueries({ queryKey: ['trafico-detail', operationId] });
      queryClient.invalidateQueries({ queryKey: ['operation-timeline', operationId] });
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
          ['trafico-detail', operationId],
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
        queryClient.invalidateQueries({ queryKey: ['trafico-detail', operationId] });
        queryClient.invalidateQueries({ queryKey: ['operation-timeline', operationId] });
      } catch {
        showToast.error('No se pudo devolver el soporte');
      } finally {
        setIsReviewing(null);
      }
    }
  };

  const handleDocumentaryClosure = async () => {
    if (documentaryClosureMissing.length > 0 || isClosingDocumentally) return;
    const confirmation = await Swal.fire({
      title: 'Aprobar cierre documental',
      text: 'Al aprobar, la operación quedará FINALIZADA y no se podrá reabrir desde este flujo.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Aprobar y finalizar',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#15803d',
    });
    if (!confirmation.isConfirmed) return;

    setIsClosingDocumentally(true);
    try {
      const updatedOperation = await closeDocumentally(operationId);
      queryClient.setQueryData<Operation | undefined>(
        ['trafico-detail', operationId],
        (oldOperation) =>
          oldOperation
            ? { ...oldOperation, ...updatedOperation }
            : updatedOperation,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['trafico-detail', operationId] }),
        queryClient.invalidateQueries({ queryKey: ['trafico'] }),
        queryClient.invalidateQueries({ queryKey: ['trafico-client-operations'] }),
        queryClient.invalidateQueries({ queryKey: ['operations'] }),
      ]);
      showToast.success('Cierre documental aprobado. La operación fue finalizada.');
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
              </p>
            </div>
            <StatusBadge status={currentOperation.status} />
          </div>

          <div className={styles.summaryMetrics}>
            <div className={styles.summaryMetric}>
              <span className={styles.summaryMetricLabel}>Tipo de carga</span>
              <strong className={styles.summaryMetricValue}>
                {currentOperation.tipoCarga ||
                  (currentOperation.isContainerized ? 'CONTENERIZADA' : 'SUELTA')}
              </strong>
            </div>
            <div className={styles.summaryMetric}>
              <span className={styles.summaryMetricLabel}>Flete a cobrar</span>
              <strong className={styles.summaryMetricValue}>
                {currentOperation.fleteACobrarManual != null ||
                currentOperation.fleteACobrar != null
                  ? `$ ${fleteBase.toLocaleString('es-CO')}`
                  : 'Pendiente'}
              </strong>
            </div>
            <div className={`${styles.summaryMetric} ${styles.summaryMetricHighlight}`}>
              <span className={styles.summaryMetricLabel}>Flete a pagar</span>
              <strong className={styles.summaryMetricValue}>
                {currentOperation.fleteAPagar == null
                  ? 'Pendiente'
                  : `$ ${fleteAPagar.toLocaleString('es-CO')}`}
              </strong>
              {currentOperation.retencionFlotaPorcentaje != null && (
                <small>
                  Retención afiliación: {currentOperation.retencionFlotaPorcentaje}%
                </small>
              )}
            </div>
            <div className={styles.summaryMetric}>
              <span className={styles.summaryMetricLabel}>Conductor</span>
              <strong className={styles.summaryMetricValue}>
                {currentOperation.driver?.name || 'Sin asignar'}
              </strong>
            </div>
          </div>

          <InspectionResult operation={currentOperation} />

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

          {/* INFO PRINCIPAL (Analista y Fechas Clave) */}
          <div className={styles.grid2Col}>
            <div className={styles.infoCard}>
              <span className={styles.label}>Analista a Cargo</span>
              <strong className={`${styles.value} ${styles.valueLarge}`}>
                {currentOperation.analyst?.name || 'No asignado'}
              </strong>
            </div>
          </div>

          {/* RUTAS Y TIEMPOS */}
          <div>
            <h3 className={styles.sectionTitle}>
              <MapPin size={18} color="#64748b" /> Ruta y Tiempos
            </h3>
            {currentOperation.stops && currentOperation.stops.length > 0 && (
              <ol className={styles.routeStops}>
                {[...currentOperation.stops]
                  .sort((left, right) => left.stopOrder - right.stopOrder)
                  .map((stop) => (
                    <li className={styles.routeStop} key={stop.id ?? stop.stopOrder}>
                      <span className={styles.routeStopOrder}>
                        {stop.stopOrder + 1}
                      </span>
                      <div>
                        <strong>
                          {stop.stopType === 'CARGUE' ? 'Cargue' : 'Descargue'} ·{' '}
                          {stop.location?.name || stop.address || 'Ubicación'}
                        </strong>
                        <span>{stop.client?.razonSocial || 'Cliente'}</span>
                        {(stop.address || stop.location?.address) && (
                          <small>{stop.address || stop.location?.address}</small>
                        )}
                        {stop.contactName && <small>Contacto: {stop.contactName}</small>}
                        {stop.contactPhone && <small>Teléfono: {stop.contactPhone}</small>}
                        {stop.observations && <small>Observaciones: {stop.observations}</small>}
                        {stop.cargoDescription && (
                          <small>{stop.cargoDescription}</small>
                        )}
                        {stop.weightKg != null && (
                          <small>
                            {Number(stop.weightKg).toLocaleString('es-CO')} kg
                          </small>
                        )}
                      </div>
                    </li>
                  ))}
              </ol>
            )}
            <div className={styles.grid2Col}>
              <div className={styles.infoBlock} style={{ flex: 1 }}>
                <span className={styles.label}>Origen</span>
                <p className={styles.value}>{currentOperation.origen?.name || '---'}</p>
                <p className={styles.dateSub}>
                  <Clock size={12}/>{' '}
                  {formatAppointmentLocationLabel(
                    'Cita de origen',
                    currentOperation.origen?.name,
                  )}
                  : {formatDate(currentOperation.fechaCitaOrigen)}
                </p>
              </div>
              <div className={styles.infoBlock} style={{ flex: 1 }}>
                <span className={styles.label}>Destino</span>
                <p className={styles.value}>{currentOperation.destino?.name || currentOperation.descargue?.name || '---'}</p>
                <p className={styles.dateSub}>
                   <Clock size={12}/>{' '}
                   {formatAppointmentLocationLabel(
                     'Cita de destino',
                     currentOperation.destino?.name ||
                       currentOperation.descargue?.name,
                   )}
                   : {formatDate(currentOperation.fechaCitaDestino)}
                </p>
              </div>
            </div>
            <div className={styles.gridAuto}>
              <div className={styles.infoBlock}>
                <span className={styles.label}>Lugar de cargue</span>
                <p className={styles.value}>{currentOperation.cargue?.name || '---'}</p>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.label}>Lugar de descargue</span>
                <p className={styles.value}>{currentOperation.descargue?.name || '---'}</p>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.label}>Fecha de retiro</span>
                <p className={styles.value}>{formatDate(currentOperation.fechaRetiro)}</p>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.label}>Asignación</span>
                <p className={styles.value}>{formatDate(currentOperation.fechaAsignacion)}</p>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.label}>Programada</span>
                <p className={styles.value}>{formatDate(currentOperation.scheduledAt)}</p>
              </div>
            </div>
          </div>

          {(currentOperation.containerStatus === 'PENDIENTE_DEVOLUCION' ||
            currentOperation.nuevoDestinoId ||
            deviationNotice) && (
            <div className={styles.infoBlock}>
              <h3 className={styles.sectionTitle}>
                <MapPin size={18} color="#d97706" /> Desvío / devolución
              </h3>
              <div className={styles.grid2Col}>
                <div>
                  <span className={styles.label}>Ruta confirmada</span>
                  <p className={styles.value}>
                    {currentOperation.destino?.name ||
                      currentOperation.descargue?.name ||
                      'Patio de devolución'}
                    {' → '}
                    {deviationDestination || 'Pendiente de confirmación'}
                  </p>
                </div>
                <div>
                  <span className={styles.label}>Cita del desvío</span>
                  <p className={styles.value}>
                    {formatDate(deviationAppointment)}
                  </p>
                </div>
              </div>
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
                      <span className={styles.label}>
                        Contenedor leído
                      </span>
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
              {comodatoEvidences.map((evidence) =>
                evidence.url ? (
                  <a
                    key={evidence.id}
                    href={evidence.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver foto del comodato
                  </a>
                ) : null,
              )}
            </div>
          )}

          <div>
            <h3 className={styles.sectionTitle}>
              <Clock size={18} color="#64748b" /> Marcas de tiempo
            </h3>
            <div className={styles.gridAuto}>
              {[
                ['Inicio', currentOperation.horaInicio],
                ['Llegada', currentOperation.horaLlegada],
                ['Atención', currentOperation.horaAtencion],
                ['Cargue', currentOperation.horaCargue],
                ['Descargue', currentOperation.horaDescargue],
                ['Salida', currentOperation.horaSalida],
                ['Finalización', currentOperation.horaFinal],
              ].map(([label, timestamp]) => (
                <div className={styles.infoBlock} key={label}>
                  <span className={styles.label}>{label}</span>
                  <strong className={styles.value}>{formatDate(timestamp)}</strong>
                </div>
              ))}
              <div className={styles.infoBlock}>
                <span className={styles.label}>Creada</span>
                <strong className={styles.value}>{formatDate(currentOperation.createdAt)}</strong>
              </div>
            </div>
          </div>

          {/* EQUIPO Y CARGA */}
          <div>
            <h3 className={styles.sectionTitle}>
              <Truck size={18} color="#64748b" /> Equipo, Carga y Finanzas
            </h3>
            
            <div className={styles.gridAuto}>
              <div className={styles.infoBlock}>
                <span className={styles.label}>Tipo de carga</span>
                <strong className={styles.value}>
                  {currentOperation.tipoCarga ||
                    (currentOperation.isContainerized
                      ? 'Contenerizada'
                      : 'Carga suelta')}
                </strong>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.label}>Vehículo</span>
                <div>
                  <span className={styles.plateBadge}>
                    {currentOperation.placaIA || currentOperation.vehicle?.plate || 'Sin Asignar'}
                  </span>
                </div>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.label}>Remolque / Chasis</span>
                <strong className={styles.value}>{currentOperation.trailer?.plate || '---'}</strong>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.label}>Conductor Asignado</span>
                <strong className={styles.value}>{currentOperation.driver?.name || '---'}</strong>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.label}>Contenedor / Tipo</span>
                <div>
                  <strong className={styles.value}>{currentOperation.containerNumber || '---'}</strong>
                  <span className={styles.containerType}>({currentOperation.containerType || '-'})</span>
                </div>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.label}>Peso</span>
                <strong className={styles.value}>
                  {currentOperation.isContainerized
                    ? currentOperation.peso == null
                      ? '---'
                      : `${Number(currentOperation.peso).toLocaleString('es-CO')} kg`
                    : currentOperation.weight == null
                      ? '---'
                      : `${Number(currentOperation.weight).toLocaleString('es-CO')} kg`}
                </strong>
              </div>
              {!currentOperation.isContainerized && (
                <div className={styles.infoBlock}>
                  <span className={styles.label}>Dimensiones de carga</span>
                  <strong className={styles.value}>
                    {currentOperation.dimensions || '---'}
                  </strong>
                </div>
              )}
              {!currentOperation.isContainerized &&
                currentOperation.cargoDescription && (
                  <div className={styles.infoBlock}>
                    <span className={styles.label}>Descripción de carga</span>
                    <strong className={styles.value}>
                      {currentOperation.cargoDescription}
                    </strong>
                  </div>
                )}
              <div className={styles.infoBlock}>
                <span className={styles.label}>Flete a cobrar / pagar</span>
                <div className={styles.financialList}>
                  <div className={styles.financialRow}>
                    <span>Flete a cobrar{currentOperation.fleteACobrarManual != null ? ' (manual)' : ''}</span>
                    <strong>{currentOperation.fleteACobrarManual != null || currentOperation.fleteACobrar != null
                      ? `$ ${fleteBase.toLocaleString('es-CO')}`
                      : 'Pendiente'}</strong>
                  </div>

                  {/* 🚀 RENDERIZADO DINÁMICO DE RECARGOS Y PATIO */}
                  {recargos.length > 0 ? recargos.map((surcharge) => (
                    <div className={styles.financialRow} key={surcharge.id}>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span>
                          <strong>{surcharge.surcharge?.name || surcharge.surchargeCode}</strong>
                          {surcharge.quantity > 1 ? ` · ${surcharge.quantity} unid.` : ''}
                        </span>
                        {surcharge.observations && (
                          <small style={{ color: '#64748b' }}>{surcharge.observations}</small>
                        )}
                        {surcharge.novedad && (
                          <small style={{ color: '#475569' }}>
                            Novedad #{surcharge.novedad.id}
                            {surcharge.novedad.category
                              ? ` · ${surcharge.novedad.category.replaceAll('_', ' ')}`
                              : ''}
                          </small>
                        )}
                        {Number(surcharge.costPrice) > 0 && (
                          <small style={{ color: '#b91c1c' }}>
                            Costo Prov: $ {Number(surcharge.costPrice).toLocaleString('es-CO')}
                          </small>
                        )}
                      </span>
                      <strong style={{ color: '#b45309' }}>Venta: $ {Number(surcharge.totalPrice).toLocaleString('es-CO')}</strong>
                    </div>
                  )) : (
                    <div className={styles.financialRow}>
                      <span>Novedades y Recargos</span>
                      <strong>—</strong>
                    </div>
                  )}

                  <div className={styles.financialRow}>
                    <span>Total cobros extra</span>
                    <strong>$ {totalCobrosExtras.toLocaleString('es-CO')}</strong>
                  </div>

                  <div className={styles.financialRow}>
                    <span>Flete a pagar (Flota)</span>
                    <strong>{currentOperation.fleteAPagar == null ? 'Pendiente' : `$ ${fleteAPagar.toLocaleString('es-CO')}`}</strong>
                  </div>

                  <div className={styles.financialRow}>
                    <span>Retención de flota</span>
                    <strong>{currentOperation.retencionFlotaPorcentaje == null
                      ? '—'
                      : `${Number(currentOperation.retencionFlotaPorcentaje).toLocaleString('es-CO')} %`}</strong>
                  </div>

                  <div className={styles.totalRow}>
                    <span>Total cobro cliente</span>
                    <strong>{granTotalCobro == null
                      ? 'Pendiente'
                      : `$ ${Number(granTotalCobro).toLocaleString('es-CO')}`}</strong>
                  </div>
                </div>

                {/* 🚀 ELIMINAMOS LA ALERTA QUEMADA DEL PATIO Y DEJAMOS SOLO LA RENTABILIDAD */}
                <strong
                  style={{
                    color:
                      currentOperation.rentabilidadBruta === null ||
                      currentOperation.rentabilidadBruta === undefined
                        ? '#94a3b8'
                        : currentOperation.rentabilidadBruta >= 0
                          ? '#15803d'
                          : '#dc2626',
                    display: 'block',
                    marginTop: '12px'
                  }}
                >
                  Rentabilidad bruta:{' '}
                  {currentOperation.rentabilidadBruta === null ||
                  currentOperation.rentabilidadBruta === undefined
                    ? 'Pendiente de pago de flota'
                    : `$ ${currentOperation.rentabilidadBruta.toLocaleString('es-CO')}`}
                </strong>
              </div>
            </div>
            <div className={styles.gridAuto}>
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
                  {ContainerStatusLabels[containerStatus] || containerStatus.replace(/_/g, ' ')}
                </strong>
                {canCorrectContainer && (
                  <button
                    type="button"
                    className={styles.btnViewEvidence}
                    disabled={isCorrectingContainer}
                    onClick={() => void handleContainerCorrection().catch((error: unknown) => showToast.error(error, 'No se pudo corregir el contenedor.'))}
                  >
                    <RotateCcw size={14} /> Corregir estado del contenedor
                  </button>
                )}
                {currentOperation.containerIssueDescription && (
                  <p className={styles.dateSub}>
                    Falla reportada: {currentOperation.containerIssueDescription}
                  </p>
                )}
                {currentOperation.containerStatusUpdatedAt && (
                  <p className={styles.dateSub}>
                    Último reporte: {formatDate(currentOperation.containerStatusUpdatedAt)}
                  </p>
                )}
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.label}>Cargue</span>
                <strong className={styles.value}>
                  {formatDuration(currentOperation.loadingStartedAt, currentOperation.loadingCompletedAt)}
                </strong>
                <p className={styles.dateSub}>
                  {formatDate(currentOperation.loadingStartedAt)} — {formatDate(currentOperation.loadingCompletedAt)}
                </p>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.label}>Descargue</span>
                <strong className={styles.value}>
                  {formatDuration(currentOperation.unloadingStartedAt, currentOperation.unloadingCompletedAt)}
                </strong>
                <p className={styles.dateSub}>
                  {formatDate(currentOperation.unloadingStartedAt)} — {formatDate(currentOperation.unloadingCompletedAt)}
                </p>
              </div>
            </div>
          </div>

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
              <div className={styles.infoBlock}>
                <span className={styles.label}>PIN Retiro</span>
                <strong className={styles.value}>{currentOperation.pinRetiro || '---'}</strong>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.label}>Precinto (Seal)</span>
                <strong className={styles.value}>{currentOperation.sealNumber || '---'}</strong>
              </div>
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

          {currentOperation.status === 'CIERRE_FISICO' && (
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