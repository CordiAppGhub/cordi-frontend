'use client';

import React from 'react';
import { Clock, UserCircle2, CheckCircle2, FileImage, AlertTriangle, Calendar, Edit3 } from 'lucide-react';
import styles from './OperationTimeline.module.css'; // Asegúrate de agregar estilos para los nuevos elementos
import { AuditEvent } from '../../hooks/useOperationTimeline';

interface OperationTimelineProps {
  events: AuditEvent[];
  onViewImage: (url: string) => void;
}

export const OperationTimeline: React.FC<OperationTimelineProps> = ({ events, onViewImage }) => {
  if (!events || events.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
        No hay registros de auditoría para esta operación.
      </div>
    );
  }

  // 🔧 Helper para asignar iconos/colores según el tipo de evento
const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'PROGRAMACION': return <Calendar size={16} color="#3b82f6" />;
      case 'ESTADO_ACTUALIZADO': return <CheckCircle2 size={16} color="#10b981" />;
      case 'EVIDENCIA_SUBIDA': return <FileImage size={16} color="#8b5cf6" />;
      case 'NOVEDAD': return <AlertTriangle size={16} color="#ef4444" />;
      case 'REASIGNACION_CONDUCTOR': return <UserCircle2 size={16} color="#f97316" />;
      case 'ACTUALIZACION_OPERACION': return <Edit3 size={16} color="#6366f1" />;
      default: return <Clock size={16} color="#64748b" />;
    }
  };

  return (
    <div className={styles.timelineContainer}>
      {events.map((event) => (
        <div key={event.id} className={styles.eventNode}>
          <div className={styles.dot} />
          
          <div className={styles.content}>
            <div className={styles.header}>
              <div className={styles.title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {getEventIcon(event.eventType)}
                {event.eventType.replace(/_/g, ' ')}
              </div>
              <div className={styles.dateRow}>
                <Clock size={14} color="#94a3b8" />
                {new Date(event.createdAt).toLocaleString('es-CO', { 
                  dateStyle: 'medium', 
                  timeStyle: 'medium' // Mostramos los segundos exactos por temas forenses
                })}
              </div>
            </div>

            <div className={styles.details}>
              <p style={{ margin: '8px 0', fontSize: '14px', color: '#334155' }}>
                {event.description}
              </p>

              {/* Módulo de Evidencias Integrado */}
              {event.eventType === 'EVIDENCIA_SUBIDA' && event.metadata?.url && (
                <button 
                  onClick={() => onViewImage(event.metadata.url)}
                  style={{
                    marginTop: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: '#e0e7ff',
                    color: '#4f46e5',
                    border: '1px solid #c7d2fe',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  <FileImage size={14} /> Ver Soporte 
                </button>
              )}
            </div>

            {/* La Firma Digital */}
            <div className={styles.driverRow} style={{ marginTop: '12px', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '6px', fontSize: '12px' }}>
              <UserCircle2 size={14} color="#64748b" />
              <span>Realizado por: <strong>{event.actor?.name || 'Sistema Automático'}</strong> ({event.actor?.role || 'AUTO'})</span>
            </div>
            
          </div>
        </div>
      ))}
    </div>
  );
};