'use client';

import React from 'react';
import { Operation } from '@/types/operation-types'; // Ajusta la ruta a tus tipos
import { AlertTriangle, MapPin, Clock, Truck, FileText } from 'lucide-react';
import { StatusBadge } from '@/components/atoms/badge.tsx/badge'; // Ajusta la ruta a tu badge
import styles from './OperationSummaryTab.module.css'; // 👈 Importamos el CSS Module

interface OperationSummaryTabProps {
  operation: Operation | null;
  isLoading: boolean;
}

export const OperationSummaryTab: React.FC<OperationSummaryTabProps> = ({ operation, isLoading }) => {
  
  if (isLoading) {
    return <div className={styles.centerMessage}>Cargando ficha técnica...</div>;
  }

  if (!operation) {
    return <div className={`${styles.centerMessage} ${styles.errorMessage}`}>No hay datos disponibles para esta operación.</div>;
  }

  // --- LÓGICA GERENCIAL: ¿Qué le falta a esta operación? ---
  const getMissingData = () => {
    const missing = [];
    if (!operation.vehicleId) missing.push('Flota sin asignar');
    if (!operation.containerNumber && (operation.type === 'IMPORTACION' || operation.type === 'EXPORTACION')) missing.push('Falta el número de contenedor');
    if (!operation.documentoTransporte) missing.push('Falta Documento de Transporte / BL');
    if (operation.destino && !operation.fechaCitaDestino) missing.push('Destino asignado sin fecha de cita');
    return missing;
  };

  const missingData = getMissingData();

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleString('es-CO', {
      month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  return (
    <div className={styles.container}>
      
      {/* 🔴 ALERTAS (Lo que falta) */}
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

      {/* 🔵 INFO PRINCIPAL */}
      <div className={styles.grid2Col}>
        <div className={styles.infoCard}>
          <span className={styles.label}>Analista a Cargo</span>
          <strong className={`${styles.value} ${styles.valueLarge}`}>
            {operation.analystId || 'No asignado'}
          </strong>
        </div>
        
        <div className={styles.infoCard}>
          <span className={styles.label}>Estado Actual</span>
          <StatusBadge status={operation.status} /> 
        </div>
      </div>

      {/* 📍 RUTA LOGÍSTICA */}
      <div>
        <h3 className={styles.sectionTitle}>
          <MapPin size={18} color="#64748b" /> Ruta y Tiempos
        </h3>
        <div className={styles.grid2Col}>
          <div className={styles.infoBlock} style={{ flex: 1 }}>
            <span className={styles.label}>Origen</span>
            <p className={styles.value} style={{ margin: '4px 0' }}>{operation.origen?.name || '---'}</p>
            <p className={styles.dateSub}>
              <Clock size={12}/> Cita: {formatDate(operation.fechaCitaOrigen)}
            </p>
          </div>
          <div className={styles.infoBlock} style={{ flex: 1 }}>
            <span className={styles.label}>Destino</span>
            <p className={styles.value} style={{ margin: '4px 0' }}>{operation.destino?.name || operation.descargue?.name || '---'}</p>
            <p className={styles.dateSub}>
               <Clock size={12}/> Cita: {formatDate(operation.fechaCitaDestino)}
            </p>
          </div>
        </div>
      </div>

      {/* 🚛 EQUIPO Y CARGA */}
      <div>
        <h3 className={styles.sectionTitle}>
          <Truck size={18} color="#64748b" /> Equipo y Carga
        </h3>
        
        <div className={styles.gridAuto}>
          <div className={styles.infoBlock}>
            <span className={styles.label}>Vehículo</span>
            <div>
              <span className={styles.plateBadge}>
                {operation.vehicle?.plate || 'Sin Asignar'}
              </span>
            </div>
          </div>
          <div className={styles.infoBlock}>
            <span className={styles.label}>Conductor</span>
            <strong className={styles.value}>{operation.driver?.name || '---'}</strong>
          </div>
          <div className={styles.infoBlock}>
            <span className={styles.label}>Contenedor / Tamaño</span>
            <div>
              <strong className={styles.value}>{operation.containerNumber || '---'}</strong>
              <span className={styles.containerType}>({operation.containerType || '-'})</span>
            </div>
          </div>
          <div className={styles.infoBlock}>
            <span className={styles.label}>Peso Declarado</span>
            <strong className={styles.value}>
              {operation.peso ? `${operation.peso} Ton` : '---'}
            </strong>
          </div>
        </div>
      </div>

      {/* 📄 DOCUMENTACIÓN */}
      <div>
        <h3 className={styles.sectionTitle}>
          <FileText size={18} color="#64748b" /> Documentación de Viaje
        </h3>
        
        <div className={styles.gridAuto}>
          <div className={styles.infoBlock}>
            <span className={styles.label}>Documento Trans. / BL</span>
            <strong className={styles.value}>{operation.documentoTransporte || '---'}</strong>
          </div>
          <div className={styles.infoBlock}>
            <span className={styles.label}>PIN Retiro</span>
            <strong className={styles.value}>{operation.pinRetiro || '---'}</strong>
          </div>
          <div className={styles.infoBlock}>
            <span className={styles.label}>Precinto (Seal)</span>
            <strong className={styles.value}>{operation.sealNumber || '---'}</strong>
          </div>
          <div className={styles.infoBlock}>
             <span className={styles.label}>Límite Devolución</span>
             <strong className={`${styles.value} ${styles.valueHighlight}`}>
               {formatDate(operation.fechaLimiteDevolucion)}
             </strong>
          </div>
        </div>
      </div>

    </div>
  );
};