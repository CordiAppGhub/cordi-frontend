// src/app/driver/components/CurrentTripTab.tsx
'use client';

import React from 'react';
import styles from '../driver.module.css';
import { OperationWorkflow } from './workflow/operation-workflow';
import { Operation } from '@/types/driver-portal.types';

interface CurrentTripTabProps {
  driver: any;
  activeOperation: Operation | undefined;
  vehiculo: any;
  processingState: boolean;
  onUpdateState: (operationId: number, estadoViaje: string) => Promise<void>;
  onOpenOcrModal: () => void;
  onOpenClosingModal: () => void;
  onOpenDetailsModal: () => void;
}

export function CurrentTripTab({
  driver,
  activeOperation,
  vehiculo,
  processingState,
  onUpdateState,
  onOpenOcrModal,
  onOpenClosingModal,
  onOpenDetailsModal,
}: CurrentTripTabProps) {
  return (
    <div className={styles.gridLayout}>
      <div className={styles.infoCard}>
        <div className={styles.vehicleHeader}>
          <div className={styles.truckIconBox}>🚛</div>
          <div className={styles.truckData}>
            <h2>{vehiculo?.plate || 'SIN ASIGNAR'}</h2>
            <p>Conductor: {driver.name}</p>
          </div>
          <span className={styles.statusBadgeGreen}>Operativa</span>
        </div>

        <hr className={styles.divider} />

        <div className={styles.tripDetails}>
          <h3 style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '12px' }}>VIAJE ACTUAL</h3>
          {activeOperation ? (
            <div className={styles.tripDataGrid}>
              <span className={styles.label}>Cliente</span>
              <span className={styles.value}>
                {(activeOperation as any).clientName || 'Gamalog'} ({(activeOperation as any).clientLocationName || 'Sede'})
              </span>
              
              <span className={styles.label}>Ruta</span>
              <span className={styles.value}>
                {(activeOperation as any).origenName || 'Origen'} ➡️ {(activeOperation as any).clientName} ➡️ {(activeOperation as any).destinoName || 'Patio'}
              </span>

              <span className={styles.label}>Pago Estimado</span>
              <span className={styles.value} style={{ color: '#059669', fontWeight: 'bold', fontSize: '1.1rem' }}>
                ${Number((activeOperation as any).fletePago || 0).toLocaleString('es-CO')}
              </span>
            </div>
          ) : (
            <p className={styles.emptyState}>No tienes viajes asignados en este momento.</p>
          )}
        </div>

        {activeOperation && (
          <a 
            href="#" 
            className={styles.linkDetails}
            onClick={(e) => {
              e.preventDefault();
              onOpenDetailsModal();
            }}
          >
            Ver detalles &gt;
          </a>
        )}
      </div>

      <div className={styles.sequenceCard}>
        {activeOperation ? (
          <OperationWorkflow
            operation={activeOperation}
            isLoading={processingState}
            onUpdateState={onUpdateState}
            onOpenOcrModal={onOpenOcrModal}
            onOpenClosingModal={onOpenClosingModal}
          />
        ) : (
           <div className={styles.emptyWorkflow}>
             <span style={{ fontSize: '2rem' }}>☕</span>
             <p style={{ color: '#64748b', marginTop: '12px' }}>Esperando asignación de viaje...</p>
           </div>
        )}
      </div>
    </div>
  );
}