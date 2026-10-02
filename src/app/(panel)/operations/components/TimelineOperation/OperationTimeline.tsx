'use client';

import React from 'react';
import { MapPin, ArrowRight, Clock, UserCircle2 } from 'lucide-react';
import { StatusBadge } from '@/components/atoms/badge.tsx/badge';
import styles from './OperationTimeline.module.css';

import { SubOperation } from '@/types/operation-types'; 

interface OperationTimelineProps {
  childrenOperations?: SubOperation[];
}

export const OperationTimeline: React.FC<OperationTimelineProps> = ({ childrenOperations }) => {
  if (!childrenOperations || childrenOperations.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
        El contenedor no ha reportado desvíos ni sub-rutas.
      </div>
    );
  }

  return (
    <div className={styles.timelineContainer}>
      {childrenOperations.map((op) => (
        <div key={op.id} className={styles.eventNode}>
          <div className={styles.dot} />
          
          <div className={styles.content}>
            <div className={styles.header}>
              <div className={styles.title}>
                <span className={styles.opId}>#{op.id}</span>
                {op.type.replace(/_/g, ' ')}
              </div>
              <StatusBadge status={op.status} />
            </div>

            <div className={styles.details}>
              {(op.origen || op.destino) && (
                <div className={styles.routeRow}>
                  <MapPin size={16} color="#ef4444" />
                  <span>{op.origen?.name || 'Origen no registrado'}</span>
                  <ArrowRight size={14} color="#cbd5e1" />
                  <span>{op.destino?.name || 'Destino no registrado'}</span>
                </div>
              )}

              <div className={styles.dateRow}>
                <Clock size={14} />
                {new Date(op.createdAt).toLocaleString('es-CO', { 
                  dateStyle: 'medium', 
                  timeStyle: 'short' 
                })}
              </div>
            </div>

            {op.driver && (
              <div className={styles.driverRow}>
                <UserCircle2 size={16} color="#64748b" />
                Asignado en este trayecto: <strong>{op.driver.name}</strong>
              </div>
            )}
            
          </div>
        </div>
      ))}
    </div>
  );
};