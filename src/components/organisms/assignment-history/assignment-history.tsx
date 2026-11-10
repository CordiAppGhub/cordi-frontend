'use client';

import React from 'react';
import { History, ArrowRight, User, Shield, Trash2 } from 'lucide-react';
import { useAssignmentHistory } from '@/hooks/useAssignmentHistory';
import { ClientAssignmentLog, AssignmentChangeReason } from '@/types/assignmentAnlist';
import styles from './assignment-history.module.css';

interface AssignmentHistoryProps {
  clientId: number;
  clientName: string;
}

const reasonLabel: Record<AssignmentChangeReason, string> = {
  ASIGNACION_INICIAL: 'Asignación inicial',
  CAMBIO_DE_ANALISTA: 'Cambio de analista',
  DESASIGNACION: 'Desasignación',
};

const reasonIcon: Record<AssignmentChangeReason, React.ReactNode> = {
  ASIGNACION_INICIAL: <Shield size={14} />,
  CAMBIO_DE_ANALISTA: <ArrowRight size={14} />,
  DESASIGNACION: <Trash2 size={14} />,
};

const reasonStyle: Record<AssignmentChangeReason, string> = {
  ASIGNACION_INICIAL: 'success',
  CAMBIO_DE_ANALISTA: 'info',
  DESASIGNACION: 'danger',
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Bogota',
  }).format(new Date(iso));
}

function HistoryEntry({ log }: { log: ClientAssignmentLog }) {
  const style = reasonStyle[log.reason];

  return (
    <div className={styles.entry}>
      <div className={`${styles.dot} ${styles[`dot_${style}`]}`}>
        {reasonIcon[log.reason]}
      </div>
      <div className={styles.entryBody}>
        <div className={styles.entryHeader}>
          <span className={`${styles.badge} ${styles[`badge_${style}`]}`}>
            {reasonLabel[log.reason]}
          </span>
          <span className={styles.timestamp}>{formatDate(log.createdAt)}</span>
        </div>
        <div className={styles.analystRow}>
          {log.previousAnalyst ? (
            <>
              <span className={styles.analystPrev}>
                <User size={12} /> {log.previousAnalyst.name ?? `#${log.previousAnalystId}`}
              </span>
              <ArrowRight size={12} className={styles.arrow} />
            </>
          ) : null}
          {log.newAnalyst ? (
            <span className={styles.analystNew}>
              <User size={12} /> {log.newAnalyst.name ?? `#${log.newAnalystId}`}
            </span>
          ) : (
            <span className={styles.analystNone}>Sin analista</span>
          )}
        </div>
        {log.notes && <p className={styles.notes}>{log.notes}</p>}
        <span className={styles.performer}>
          Ejecutado por: <strong>{log.performedBy.name ?? `Usuario #${log.performedById}`}</strong>
        </span>
      </div>
    </div>
  );
}

export const AssignmentHistory: React.FC<AssignmentHistoryProps> = ({ clientId, clientName }) => {
  const { history, isLoading } = useAssignmentHistory(clientId);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <History size={16} />
        <span>Historial de asignaciones — {clientName}</span>
      </div>

      {isLoading && (
        <div className={styles.loading}>Cargando historial...</div>
      )}

      {!isLoading && history.length === 0 && (
        <div className={styles.empty}>
          Sin registros de asignación todavía.
        </div>
      )}

      {!isLoading && history.length > 0 && (
        <div className={styles.timeline}>
          {history.map((log) => (
            <HistoryEntry key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
};
