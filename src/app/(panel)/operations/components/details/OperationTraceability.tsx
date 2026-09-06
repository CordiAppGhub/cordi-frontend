'use client';

import { useEffect, useState } from 'react';
import styles from './OperationTraceability.module.css';
import { useOperations } from '../../hooks/useOperations';
import { socket } from '@/lib/socket';
import { useOperationStore } from '@/store/use-operation.store';

interface Props {
  operationId: number;
}

export function OperationTraceability({ operationId }: Props) {
  const { currentOperation, isLoadingCurrent, fetchOperationById } = useOperations();
  const updateOperation = useOperationStore((state) => state.updateOperation);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (operationId) {
      fetchOperationById(operationId);

      const updateEvent = `operation_${operationId}_updated`;
      const evidenceEvent = `operation_${operationId}_evidence`;

      const handleUpdate = (newData: any) => {
        updateOperation(operationId, newData);
      };

      const handleNewEvidence = (newEvidence: any) => {
        const currentState = useOperationStore.getState().currentOperation;
        if (currentState?.id === operationId) {
          updateOperation(operationId, {
            evidences: [...(currentState.evidences || []), newEvidence],
          });
        }
      };

      socket.on(updateEvent, handleUpdate);
      socket.on(evidenceEvent, handleNewEvidence);

      return () => {
        socket.off(updateEvent, handleUpdate);
        socket.off(evidenceEvent, handleNewEvidence);
      };
    }
  }, [operationId, fetchOperationById, updateOperation]);

  if (isLoadingCurrent) {
    return <div>Cargando detalles de la operación...</div>;
  }

  if (!currentOperation) {
    return <div>No se encontró la operación.</div>;
  }

  const isFinished = currentOperation.status === 'FINALIZADO';

  return (
    <div className={styles.wrapper}>
      {/* SECCIÓN 1: Datos IA y Trazabilidad */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Trazabilidad del Viaje</h3>
        </div>
        <div className={styles.cardContent}>
          <div className={styles.gridInfo}>
            <div>
              <p className={styles.label}>Conductor</p>
              <p className={styles.value}>{currentOperation.driver?.name || 'No asignado'}</p>
            </div>
            <div>
              <p className={styles.label}>Estado de Operación</p>
              <span className={`${styles.badge} ${isFinished ? styles.badgeSuccess : styles.badgeDefault}`}>
                {currentOperation.status}
              </span>
            </div>
            <div>
              <p className={styles.label}>Placa Registrada (IA)</p>
              <p className={`${styles.value} ${styles.mono}`}>
                {currentOperation.placaIA || currentOperation.vehicle?.plate || 'Pendiente'}
              </p>
            </div>
            <div>
              <p className={styles.label}>N° Contenedor (IA)</p>
              <p className={`${styles.value} ${styles.mono}`}>
                {currentOperation.containerNumber || 'Pendiente'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: Evidencias y Visor */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Evidencias Fotográficas</h3>
        </div>
        <div className={styles.cardContent}>
          {currentOperation.evidences && currentOperation.evidences.length > 0 ? (
            <div className={styles.gridEvidences}>
              {currentOperation.evidences.map((evidencia) => (
                <div 
                  key={evidencia.id} 
                  className={styles.evidenceItem}
                  onClick={() => setSelectedImage(evidencia.url)}
                >
                  <img 
                    src={evidencia.url} 
                    alt={`Evidencia ${evidencia.type}`} 
                    className={styles.evidenceImg}
                  />
                  <p className={styles.evidenceType}>{evidencia.type}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyState}>No hay evidencias registradas aún.</p>
          )}
        </div>
      </div>

      {/* MODAL LIGHTBOX */}
      {selectedImage && (
        <div className={styles.modalOverlay} onClick={() => setSelectedImage(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={() => setSelectedImage(null)}>
              &times;
            </button>
            <img src={selectedImage} alt="Evidencia ampliada" className={styles.modalImg} />
          </div>
        </div>
      )}
    </div>
  );
}