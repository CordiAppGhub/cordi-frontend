'use client';

import React, { useState } from 'react';
import styles from './operation-workflow.module.css';
import { Button } from '@/components/atoms/button/button';
import { OperationContainerStatus } from '@/types/driver-portal.types';

interface OperationData {
  id: number;
  type?: string;
  estadoViaje?: string;
  status?: string;
  containerStatus?: OperationContainerStatus;
  containerStatusUpdatedAt?: string | null;
  containerIssueDescription?: string | null;
  loadingStartedAt?: string | null;
  loadingCompletedAt?: string | null;
  unloadingStartedAt?: string | null;
  unloadingCompletedAt?: string | null;
}

interface OperationWorkflowProps {
  operation: OperationData;
  isLoading: boolean;
  onUpdateState: (operationId: number, newState: string) => Promise<void>;
  onUpdateContainerStatus: (
    operationId: number,
    containerStatus: OperationContainerStatus,
    issueDescription?: string,
  ) => Promise<void>;
  onOpenOcrModal: () => void;
  onOpenClosingModal: () => void;
}

const WORKFLOW_STEPS = [
  { id: 'ASIGNADO', label: 'INICIAR VIAJE AL PUERTO', nextState: 'RUMBO_AL_PUERTO', action: 'update' },
  { id: 'RUMBO_AL_PUERTO', label: 'REPORTAR LLEGADA A PUERTO', nextState: 'EN_PUERTO', action: 'update' },
  { id: 'EN_PUERTO', label: 'ESCANEAR CARGUE (OCR)', nextState: 'EN_PUERTO_CARGADO', action: 'ocr' },
  { id: 'EN_PUERTO_CARGADO', label: 'INICIAR RUTA A CLIENTE', nextState: 'RUMBO_AL_CLIENTE', action: 'update' },
  { id: 'RUMBO_AL_CLIENTE', label: 'LLEGADA A CLIENTE', nextState: 'EN_CLIENTE', action: 'update' },
  { id: 'EN_CLIENTE', label: 'SOPORTE Y FINALIZAR', nextState: 'FINALIZADO', action: 'close' },
] as const;

export function OperationWorkflow({
  operation,
  isLoading,
  onUpdateState,
  onUpdateContainerStatus,
  onOpenOcrModal,
  onOpenClosingModal,
}: OperationWorkflowProps) {
  const [selectedContainerStatus, setSelectedContainerStatus] =
    useState<OperationContainerStatus>(
      operation.containerStatus || 'PENDIENTE',
    );
  const [issueDescription, setIssueDescription] = useState('');

  const currentState = operation.estadoViaje || 'ASIGNADO';
  
  let currentIndex = WORKFLOW_STEPS.findIndex(s => s.id === currentState);
  if (currentState === 'FINALIZADO') currentIndex = WORKFLOW_STEPS.length;

  const handleAction = (step: (typeof WORKFLOW_STEPS)[number]) => {
    if (step.action === 'ocr') onOpenOcrModal();
    else if (step.action === 'close') onOpenClosingModal();
    else onUpdateState(operation.id, step.nextState);
  };

  const formatTimestamp = (value?: string | null) =>
    value
      ? new Date(value).toLocaleString('es-CO', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Pendiente';

  const formatDuration = (start?: string | null, end?: string | null) => {
    if (!start || !end) return 'En curso o sin registrar';
    const minutes = Math.max(
      0,
      Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000),
    );
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return hours ? `${hours} h ${remainder} min` : `${remainder} min`;
  };

  return (
    <div className={styles.workflowContainer}>
      <section className={styles.containerStatusSection}>
        <h3 className={styles.title}>ESTADO DEL CONTENEDOR</h3>
        <p className={styles.containerStatusCurrent}>
          Estado actual:{' '}
          <strong>
            {(operation.containerStatus || 'PENDIENTE').replace(/_/g, ' ')}
          </strong>
        </p>
        <label
          className={styles.containerStatusLabel}
          htmlFor={`container-status-${operation.id}`}
        >
          Reportar estado en campo
        </label>
        <select
          id={`container-status-${operation.id}`}
          className={styles.containerStatusSelect}
          value={selectedContainerStatus}
          onChange={(event) =>
            setSelectedContainerStatus(
              event.target.value as OperationContainerStatus,
            )
          }
          disabled={isLoading}
        >
          <option value="PENDIENTE">Pendiente</option>
          <option value="EN_PISO">Bajado a piso</option>
          <option value="EN_INSPECCION">En inspección</option>
          <option value="FALLA_REPORTADA">Presenta una falla</option>
          <option value="EN_CARGUE">Iniciar cargue</option>
          <option value="CARGADO">Cargue finalizado</option>
          <option value="EN_DESCARGUE">Iniciar descargue</option>
          <option value="DESCARGADO">Descargue finalizado</option>
        </select>
        {selectedContainerStatus === 'FALLA_REPORTADA' && (
          <textarea
            className={styles.issueDescription}
            value={issueDescription}
            onChange={(event) => setIssueDescription(event.target.value)}
            maxLength={1000}
            placeholder="Describe la falla encontrada"
            aria-label="Descripción de la falla"
            disabled={isLoading}
          />
        )}
        <Button
          variant="primary"
          isLoading={isLoading}
          disabled={
            isLoading ||
            (selectedContainerStatus === 'FALLA_REPORTADA' &&
              !issueDescription.trim())
          }
          onClick={() =>
            onUpdateContainerStatus(
              operation.id,
              selectedContainerStatus,
              selectedContainerStatus === 'FALLA_REPORTADA'
                ? issueDescription.trim()
                : undefined,
            )
          }
        >
          Reportar estado
        </Button>
        {operation.containerIssueDescription && (
          <p className={styles.issueMessage}>
            Falla reportada: {operation.containerIssueDescription}
          </p>
        )}
        <div className={styles.containerTimes}>
          <p>
            Cargue: {formatTimestamp(operation.loadingStartedAt)} —{' '}
            {formatTimestamp(operation.loadingCompletedAt)}
            {operation.loadingStartedAt && operation.loadingCompletedAt &&
              ` (${formatDuration(operation.loadingStartedAt, operation.loadingCompletedAt)})`}
          </p>
          <p>
            Descargue: {formatTimestamp(operation.unloadingStartedAt)} —{' '}
            {formatTimestamp(operation.unloadingCompletedAt)}
            {operation.unloadingStartedAt && operation.unloadingCompletedAt &&
              ` (${formatDuration(operation.unloadingStartedAt, operation.unloadingCompletedAt)})`}
          </p>
          {operation.containerStatusUpdatedAt && (
            <p>
              Último reporte: {formatTimestamp(operation.containerStatusUpdatedAt)}
            </p>
          )}
        </div>
      </section>

      <div className={styles.header}>
        <h3 className={styles.title}>SECUENCIA DEL VIAJE</h3>
        <span className={styles.stepCounter}>
          Paso {Math.min(currentIndex + 1, WORKFLOW_STEPS.length)} de {WORKFLOW_STEPS.length}
        </span>
      </div>

      <div className={styles.progressTracker}>
        {WORKFLOW_STEPS.map((_, index) => (
          <React.Fragment key={index}>
            <div className={`${styles.dot} ${index < currentIndex ? styles.dotCompleted : index === currentIndex ? styles.dotActive : ''}`} />
            {index < WORKFLOW_STEPS.length - 1 && (
              <div className={`${styles.line} ${index < currentIndex ? styles.lineCompleted : ''}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className={styles.actionList}>
        {WORKFLOW_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;
          const isLocked = index > currentIndex;

          return (
            <button
              key={step.id}
              className={`${styles.stepBtn} ${isActive ? styles.activeBtn : isCompleted ? styles.completedBtn : styles.lockedBtn}`}
              disabled={isLocked || isLoading}
              onClick={() => isActive && handleAction(step)}
            >
              <span className={styles.stepIcon}>
                {isCompleted ? '✅' : isActive ? '▶' : '🔒'}
              </span>
              {step.label}
            </button>
          );
        })}

        {currentState === 'FINALIZADO' && (
          <div className={styles.finalizedState}>
            <span>🎉</span> VIAJE FINALIZADO
          </div>
        )}
      </div>
    </div>
  );
}