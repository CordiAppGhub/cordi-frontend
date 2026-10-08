'use client';

import React, { useEffect, useState } from 'react';
import styles from './OperationTraceability.module.css';

import { useTrafico } from '../../hooks/useOperations'; // Ajusta la ruta si es necesario
import { useOperationTimeline } from '../../hooks/useOperationTimeline';
import { socket } from '@/lib/socket';
import { useQueryClient } from '@tanstack/react-query';
import { StatusBadge } from '@/components/atoms/badge.tsx/badge';
import { OperationTimeline } from '../TimelineOperation/OperationTimeline';
import Image from 'next/image';
import { FileText, Activity, AlertTriangle, MapPin, Clock, Truck } from 'lucide-react'; 

interface Props {
  operationId: number;
}

export function OperationTraceability({ operationId }: Props) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'details' | 'timeline'>('details');

  const { currentOperation, isLoadingCurrent, fetchOperationById } = useTrafico();
  const { data: timelineEvents = [], isLoading: isLoadingTimeline } = useOperationTimeline(operationId);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Efecto de Websockets (Mantengo tu lógica exacta)
  useEffect(() => {
    if (!operationId) return;
    fetchOperationById(operationId);

    const updateEvent = `operation_${operationId}_updated`;
    const evidenceEvent = `operation_${operationId}_evidence`;

    const handleUpdate = (newData: any) => {
      queryClient.setQueryData(['operation-detail', operationId], newData);
      queryClient.invalidateQueries({ queryKey: ['operation-timeline', operationId] });
    };

    const handleNewEvidence = (newEvidence: any) => {
      queryClient.setQueryData(['operation-detail', operationId], (oldData: any) => {
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

  if (isLoadingCurrent) return <div className={styles.loadingState}>Cargando detalles de la operación...</div>;
  if (!currentOperation) return <div className={styles.emptyState}>No se encontró la operación.</div>;

  // Lógica Financiera (Mantenida de tu código)
  const fleteBase = Number(currentOperation.fleteCobro || 0);
  const recargos = currentOperation.surcharges || [];
  const totalRecargos = recargos.reduce((sum: number, s: any) => sum + Number(s.totalPrice), 0);
  const granTotalCobro = fleteBase + totalRecargos;
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

  // Función para Fechas
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleString('es-CO', {
      month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true
    });
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
                {currentOperation.analystId|| 'No asignado'}
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
                <span className={styles.label}>Flete a Facturar / Pagar</span>
                <strong style={{ color: '#15803d', display: 'block' }}>Facturar: $ {granTotalCobro.toLocaleString('es-CO')}</strong>
                <strong style={{ color: '#d97706', display: 'block' }}>Pagar: {fletePago ? `$ ${fletePago.toLocaleString('es-CO')}` : 'Pendiente'}</strong>
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
                <span className={styles.label}>N° Pedido / Manifiesto</span>
                <strong className={styles.value}>{currentOperation.numeroPedido || currentOperation.documentoTransporte || '--'}</strong>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.label}>PIN Retiro</span>
                <strong className={styles.value}>{currentOperation.pinRetiro || '---'}</strong>
              </div>
              <div className={styles.infoBlock}>
                <span className={styles.label}>Precinto (Seal)</span>
                <strong className={styles.value}>{currentOperation.sealNumber || '---'}</strong>
              </div>
            </div>
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
            <div className={styles.loadingState}>Cargando historial forense...</div>
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