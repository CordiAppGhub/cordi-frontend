'use client';

import { useEffect, useState } from 'react';
import styles from './OperationTraceability.module.css';

import { useOperations } from '../../hooks/useOperations';
import { socket } from '@/lib/socket';
import { useQueryClient } from '@tanstack/react-query';
import { StatusBadge } from '@/components/atoms/badge.tsx/badge';
import { OperationTimeline } from '../TimelineOperation/OperationTimeline';
import Image from 'next/image';

interface Props {
  operationId: number;
}

export function OperationTraceability({ operationId }: Props) {
  const queryClient = useQueryClient();

  const {
    currentOperation,
    isLoadingCurrent,
    fetchOperationById,
  } = useOperations();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!operationId) return;

    fetchOperationById(operationId);

    const updateEvent = `operation_${operationId}_updated`;
    const evidenceEvent = `operation_${operationId}_evidence`;

    const handleUpdate = (newData: any) => {
      queryClient.setQueryData(
        ['operation-detail', operationId],
        newData,
      );
    };

    const handleNewEvidence = (newEvidence: any) => {
      queryClient.setQueryData(
        ['operation-detail', operationId],
        (oldData: any) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            evidences: [
              ...(oldData.evidences || []),
              newEvidence,
            ],
          };
        },
      );
    };

    socket.on(updateEvent, handleUpdate);
    socket.on(evidenceEvent, handleNewEvidence);

    return () => {
      socket.off(updateEvent, handleUpdate);
      socket.off(evidenceEvent, handleNewEvidence);
    };
  }, [operationId, fetchOperationById, queryClient]);

  if (isLoadingCurrent) {
    return (
      <div className={styles.loadingState}>
        Cargando detalles de la operación...
      </div>
    );
  }

  if (!currentOperation) {
    return (
      <div className={styles.emptyState}>
        No se encontró la operación.
      </div>
    );
  }

  const isFinished = currentOperation.status === 'FINALIZADO';

  const fleteBase = Number(currentOperation.fleteCobro || 0);

  const recargos = currentOperation.surcharges || [];

  const totalRecargos = recargos.reduce(
    (sum, surcharge) => sum + Number(surcharge.totalPrice),
    0,
  );

  const granTotalCobro = fleteBase + totalRecargos;

  const fletePago = Number(currentOperation.fletePago || 0);

  const rentabilidadFinal =
    granTotalCobro - fletePago;

  return (
    <div className={styles.wrapper}>


      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>
            Detalles del Viaje
          </h3>
        </div>

        <div className={styles.cardContent}>
          <div className={styles.gridInfo}>

            <div>
              <p className={styles.label}>Conductor</p>
              <p className={styles.value}>
                {currentOperation.driver?.name || 'No asignado'}
              </p>
            </div>

            <div>
              <p className={styles.label}>
                Estado de Operación
              </p>

              <span
                className={`${styles.badge} ${
                  isFinished
                    ? styles.badgeSuccess
                    : styles.badgeDefault
                }`}
              >
                <StatusBadge
                  status={currentOperation.status}
                />
              </span>
            </div>

            <div>
              <p className={styles.label}>
                Estado Conductor
              </p>

              <StatusBadge
                status={currentOperation.estadoViaje}
                textNull="Sin Asignar"
              />
            </div>

            <div>
              <p className={styles.label}>
                Placa Registrada
              </p>

              <p className={`${styles.value} ${styles.mono}`}>
                {currentOperation.placaIA ||
                  currentOperation.vehicle?.plate ||
                  'Pendiente'}
              </p>
            </div>

            <div>
              <p className={styles.label}>
                N° Contenedor
              </p>

              <p className={`${styles.value} ${styles.mono}`}>
                {currentOperation.containerNumber ||
                  'Pendiente'}
              </p>
            </div>

            <div>
              <p className={styles.label}>
                Cliente
              </p>

              <p className={styles.value}>
                {currentOperation.client?.razonSocial ||
                  'Tarifa Genérica'}
              </p>
            </div>

            <div>
              <p className={styles.label}>
                Total Facturación
              </p>

              <p className={`${styles.value} ${styles.moneySuccess}`}>
                $ {granTotalCobro.toLocaleString('es-CO')}
              </p>
            </div>

            <div>
              <p className={styles.label}>
                Flete Pago
              </p>

              <p className={`${styles.value} ${styles.moneyWarning}`}>
                {currentOperation.fletePago !== null &&
                currentOperation.fletePago !== undefined
                  ? `$ ${currentOperation.fletePago.toLocaleString(
                      'es-CO',
                    )}`
                  : 'Pendiente'}
              </p>
            </div>

            <div>
              <p className={styles.label}>
                Rentabilidad Proyectada
              </p>

              <p className={`${styles.value} ${styles.moneyPrimary}`}>
                $ {rentabilidadFinal.toLocaleString('es-CO')}
              </p>
            </div>

          </div>
        </div>
      </div>


      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>
            💰 Liquidación Financiera al Cliente
          </h3>
        </div>

        <div className={styles.cardContent}>
          <div className={styles.financialList}>

            <div className={styles.financialRow}>
              <span>Flete Base</span>

              <strong>
                ${fleteBase.toLocaleString('es-CO')}
              </strong>
            </div>

            {recargos.length > 0 ? (
              recargos.map((recargo) => (
                <div
                  key={recargo.id}
                  className={styles.financialRow}
                >
                  <div className={styles.surchargeInfo}>
                    <span className={styles.surchargeName}>
                      + {recargo.surcharge?.name}
                    </span>

                    <span className={styles.surchargeDetail}>
                      Cant: {recargo.quantity} | Valor Uni:
                      {' '}
                      $
                      {Number(
                        recargo.appliedPrice,
                      ).toLocaleString('es-CO')}

                      {recargo.observations
                        ? ` | Obs: ${recargo.observations}`
                        : ''}
                    </span>
                  </div>

                  <strong className={styles.surchargeTotal}>
                    $
                    {Number(
                      recargo.totalPrice,
                    ).toLocaleString('es-CO')}
                  </strong>
                </div>
              ))
            ) : (
              <div className={styles.noSurcharges}>
                No hay recargos ni novedades de facturación
                adicionales.
              </div>
            )}

            <div className={styles.totalRow}>
              <span>TOTAL A FACTURAR</span>

              <strong>
                $
                {granTotalCobro.toLocaleString('es-CO')}
              </strong>
            </div>

          </div>
        </div>
      </div>


      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>
            Evidencias Fotográficas
          </h3>
        </div>

        <div className={styles.cardContent}>
          {currentOperation.evidences && currentOperation.evidences?.length > 0 ? (
            <div className={styles.gridEvidences}>
              {currentOperation.evidences.map(
                (evidencia) => (
                  <div
                    key={evidencia.id}
                    className={styles.evidenceItem}
                    onClick={() =>
                      setSelectedImage(evidencia.url)
                    }
                  >
                    <Image
                      src={evidencia.url}
                      alt={`Evidencia ${evidencia.type}`}
                      className={styles.evidenceImg}
                      width={90}
                      height={90}
                    />

                    <p className={styles.evidenceType}>
                      {evidencia.type}
                    </p>
                  </div>
                ),
              )}
            </div>
          ) : (
            <p className={styles.emptyState}>
              No hay evidencias registradas aún.
            </p>
          )}
        </div>
      </div>


      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>
            Historial del Contenedor
          </h3>
        </div>

        <div className={styles.cardContent}>
          <OperationTimeline
            childrenOperations={currentOperation.children}
          />
        </div>
      </div>


      {selectedImage && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedImage(null)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.closeButton}
              onClick={() => setSelectedImage(null)}
            >
              &times;
            </button>

            <Image
              src={selectedImage}
              alt="Evidencia ampliada"
              className={styles.modalImg}
              width={800}
              height={600}
            />
          </div>
        </div>
      )}

    </div>
  );
}

