'use client';

import React from 'react';
import styles from './operation-workflow.module.css';
import { Button } from '@/components/atoms/button/button';

interface OperationData {
  id: number;
  type?: string;
  estadoViaje?: string;
  status?: string;
}

interface OperationWorkflowProps {
  operation: OperationData;
  isLoading: boolean;
  onUpdateState: (operationId: number, newState: string) => Promise<void>;
  onOpenOcrModal: () => void;
  onOpenClosingModal: () => void;
}

// Mapeo lógico de estados a pasos visuales
const WORKFLOW_STEPS = [
  { id: 'ASIGNADO', label: 'INICIAR VIAJE AL PUERTO', nextState: 'RUMBO_AL_PUERTO', action: 'update' },
  { id: 'RUMBO_AL_PUERTO', label: 'REPORTAR LLEGADA A PUERTO', nextState: 'EN_PUERTO', action: 'update' },
  { id: 'EN_PUERTO', label: 'ESCANEAR CARGUE (OCR)', nextState: 'EN_PUERTO_CARGADO', action: 'ocr' },
  { id: 'EN_PUERTO_CARGADO', label: 'INICIAR RUTA A CLIENTE', nextState: 'RUMBO_AL_CLIENTE', action: 'update' },
  { id: 'RUMBO_AL_CLIENTE', label: 'LLEGADA A CLIENTE', nextState: 'EN_CLIENTE', action: 'update' },
  { id: 'EN_CLIENTE', label: 'SOPORTE Y FINALIZAR', nextState: 'FINALIZADO', action: 'close' },
];

export function OperationWorkflow({
  operation,
  isLoading,
  onUpdateState,
  onOpenOcrModal,
  onOpenClosingModal,
}: OperationWorkflowProps) {
  
  const currentState = operation.estadoViaje || 'ASIGNADO';
  
  // Encontrar el índice del paso actual
  let currentIndex = WORKFLOW_STEPS.findIndex(s => s.id === currentState);
  if (currentState === 'FINALIZADO') currentIndex = WORKFLOW_STEPS.length;

  const handleAction = (step: any) => {
    if (step.action === 'ocr') onOpenOcrModal();
    else if (step.action === 'close') onOpenClosingModal();
    else onUpdateState(operation.id, step.nextState);
  };

  return (
    <div className={styles.workflowContainer}>
      <div className={styles.header}>
        <h3 className={styles.title}>SECUENCIA DEL VIAJE</h3>
        <span className={styles.stepCounter}>
          Paso {Math.min(currentIndex + 1, WORKFLOW_STEPS.length)} de {WORKFLOW_STEPS.length}
        </span>
      </div>

      {/* PROGRESS BAR VISUAL (Circulitos) */}
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

      {/* LISTA DE BOTONES VERTICAL */}
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