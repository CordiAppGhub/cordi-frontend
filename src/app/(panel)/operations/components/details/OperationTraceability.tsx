'use client';

import React, { useEffect, useState } from 'react';
import styles from './OperationTraceability.module.css';

import { useTrafico } from '../../hooks/useOperations'; // Ajusta la ruta si es necesario
import { Evidence, Operation } from '@/types/operation-types';
import { useOperationTimeline } from '../../hooks/useOperationTimeline';
import { socket } from '@/lib/socket';
import { useQueryClient } from '@tanstack/react-query';
import { StatusBadge } from '@/components/atoms/badge.tsx/badge';
import { OperationTimeline } from '../TimelineOperation/OperationTimeline';
import Image from 'next/image';
import { FileText, Activity, AlertTriangle, MapPin, Clock, Truck } from 'lucide-react'; 
import { TruckLoader } from '@/components/TruckLoader';
import { ContainerStatusLabels } from '@/constants/enum-mapping-types';

interface Props {
  operationId: number;
}

export function OperationTraceability({ operationId }: Props) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'details' | 'timeline'>('details');

  const { currentOperation, isLoadingCurrent, fetchOperationById } = useTrafico();
  const { data: timelineEvents = [], isLoading: isLoadingTimeline } = useOperationTimeline(operationId);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!operationId) return;
    fetchOperationById(operationId);

    const updateEvent = `operation_${operationId}_updated`;
    const evidenceEvent = `operation_${operationId}_evidence`;

    const handleUpdate = (newData: Partial<Operation>) => {
      queryClient.setQueryData<Operation | undefined>(
        ['trafico-detail', operationId],
        (currentOperation) =>
          currentOperation ? { ...currentOperation, ...newData } : currentOperation,
      );
      queryClient.invalidateQueries({ queryKey: ['operation-timeline', operationId] });
    };

    const handleNewEvidence = (newEvidence: Evidence) => {
      queryClient.setQueryData<Operation | undefined>(['operation-detail', operationId], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          evidences: [...(oldData.evidences || []), newEvidence],
        };
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

  // Lógica Financiera (Mantenida de tu código)
  const fleteBase = Number(
    currentOperation.fleteCobroManual ?? currentOperation.fleteCobro ?? 0,
  );
  const recargos = currentOperation.surcharges || [];
  const totalRecargos = Number(currentOperation.totalRecargos ?? 0);
  const totalCobrosExtras = Number(currentOperation.totalCobrosExtras ?? 0);
  const patioCobro = Number(currentOperation.patioCobro || 0);
  const patioCosto = Number(currentOperation.patioCosto || 0);
  const granTotalCobro = currentOperation.totalFacturacion;
  const fletePago = Number(currentOperation.fletePago || 0);

  // Lógica Gerencial: Alertas de Datos Faltantes
  const getMissingData = () => {
    const missing = [];
    if (!currentOperation.vehicleId) missing.push('Flota sin asignar');
    if (!currentOperation.containerNumber && (currentOperation.type === 'IMPORTACION' || currentOperation.type === 'EXPORTACION')) missing.push('Falta el número de contenedor');
    if (!currentOperation.documentoTransporte) missing.push('Falta Documento de Transporte / BL');
    if (currentOperation.destino && !currentOperation.fechaCitaDestino) missing.push('Destino asignado sin fecha de cita');
    return missing;
  };
  const missingData = getMissingData();
  const containerStatus = currentOperation.containerStatus || 'PENDIENTE';
  const isContainerStatusAlert = containerStatus === 'FALLA_REPORTADA';
  const isContainerStatusComplete =
    containerStatus === 'CARGADO' || containerStatus === 'DESCARGADO';

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
      </div>

      {/* 🚀 VISTA 1: FICHA TÉCNICA (Con la estructura mejorada) */}
      {activeTab === 'details' && (
        <div className={styles.card}>
          
          {/* Cabecera del Documento */}
          <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {currentOperation.client?.razonSocial || 'CLIENTE GENERAL'}
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                Operación #{currentOperation.id} · {currentOperation.type}
                {currentOperation.client?.nit ? ` · NIT ${currentOperation.client.nit}` : ''}
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

          {/* INFO PRINCIPAL (Analista y Fechas Clave) */}
          <div className={styles.grid2Col}>
            <div className={styles.infoCard}>
              <span className={styles.label}>Analista a Cargo</span>
              <strong className={`${styles.value} ${styles.valueLarge}`}>
                {currentOperation.analyst?.name || 'No asignado'}
              </strong>
            </div>
            <div className={styles.infoCard}>
              <span className={styles.label}>Límite de Devolución</span>
              <strong className={`${styles.value} ${styles.valueLarge} ${styles.valueHighlight}`}>
                {formatDate(currentOperation.fechaLimiteDevolucion)}
              </strong>
            </div>
          </div>

          {/* RUTAS Y TIEMPOS */}
          <div>
            <h3 className={styles.sectionTitle}>
              <MapPin size={18} color="#64748b" /> Ruta y Tiempos
            </h3>
            <div className={styles.grid2Col}>
              <div className={styles.infoBlock} style={{ flex: 1 }}>
                <span className={styles.label}>Origen</span>
                <p className={styles.value}>{currentOperation.origen?.name || '---'}</p>
                <p className={styles.dateSub}>
                  <Clock size={12}/> Cita: {formatDate(currentOperation.fechaCitaOrigen)}
                </p>
              </div>
              <div className={styles.infoBlock} style={{ flex: 1 }}>
                <span className={styles.label}>Destino</span>
                <p className={styles.value}>{currentOperation.destino?.name || currentOperation.descargue?.name || '---'}</p>
                <p className={styles.dateSub}>
                   <Clock size={12}/> Cita: {formatDate(currentOperation.fechaCitaDestino)}
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
                  {currentOperation.peso == null ? '---' : `${Number(currentOperation.peso).toLocaleString('es-CO')} kg`}
                </strong>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.label}>Flete a Facturar / Pagar</span>
                <div className={styles.financialList}>
                  <div className={styles.financialRow}>
                    <span>Flete cliente{currentOperation.fleteCobroManual != null ? ' (manual)' : ''}</span>
                    <strong>{currentOperation.fleteCobroManual != null || currentOperation.fleteCobro != null
                      ? `$ ${fleteBase.toLocaleString('es-CO')}`
                      : 'Pendiente'}</strong>
                  </div>
                  <div className={styles.financialRow}>
                    <span>Patio · cobro cliente{currentOperation.patio?.name ? ` (${currentOperation.patio.name})` : ''}</span>
                    <strong>{currentOperation.patioCobro == null ? '—' : `$ ${patioCobro.toLocaleString('es-CO')}`}</strong>
                  </div>
                  {recargos.length > 0 ? recargos.map((surcharge) => (
                    <div className={styles.financialRow} key={surcharge.id}>
                      <span>
                        {surcharge.surcharge?.name || surcharge.surchargeCode}
                        {surcharge.quantity > 1
                          ? ` · ${surcharge.quantity} × $ ${Number(surcharge.appliedPrice).toLocaleString('es-CO')}`
                          : ''}
                        {surcharge.observations ? ` · ${surcharge.observations}` : ''}
                      </span>
                      <strong>$ {Number(surcharge.totalPrice).toLocaleString('es-CO')}</strong>
                    </div>
                  )) : (
                    <div className={styles.financialRow}>
                      <span>Recargos adicionales</span>
                      <strong>—</strong>
                    </div>
                  )}
                  {recargos.length > 0 && (
                    <div className={styles.financialRow}>
                      <span>Subtotal recargos</span>
                      <strong>$ {totalRecargos.toLocaleString('es-CO')}</strong>
                    </div>
                  )}
                  <div className={styles.financialRow}>
                    <span>Total cobros extra</span>
                    <strong>$ {totalCobrosExtras.toLocaleString('es-CO')}</strong>
                  </div>
                  <div className={styles.financialRow}>
                    <span>Flete · pago conductor / flota</span>
                    <strong>{currentOperation.fletePago == null ? 'Pendiente' : `$ ${fletePago.toLocaleString('es-CO')}`}</strong>
                  </div>
                  <div className={styles.financialRow}>
                    <span>Patio · costo empresa</span>
                    <strong>{currentOperation.patioCosto == null ? '—' : `$ ${patioCosto.toLocaleString('es-CO')}`}</strong>
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
                {currentOperation.patioId &&
                  (currentOperation.patioCobro === null ||
                    currentOperation.patioCobro === undefined ||
                    currentOperation.patioCosto === null ||
                    currentOperation.patioCosto === undefined) && (
                    <span style={{ color: '#dc2626', display: 'block', fontSize: '0.8rem' }}>
                      Falta configurar la tarifa de este patio para el cliente.
                    </span>
                  )}
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
                <span className={styles.label}>Manifiesto / DO / BL</span>
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

      {/* MODAL / VISOR DE IMÁGENES */}
      {selectedImage && (
        <div className={styles.modalOverlay} onClick={() => setSelectedImage(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={() => setSelectedImage(null)}>&times;</button>
            <Image src={selectedImage} alt="Evidencia ampliada" className={styles.modalImg} width={800} height={600} />
          </div>
        </div>
      )}

    </div>
  );
}