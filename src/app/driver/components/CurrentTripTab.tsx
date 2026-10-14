// src/app/driver/components/CurrentTripTab.tsx
'use client';

import React from 'react';
import styles from '../driver.module.css';
import { OperationWorkflow } from './workflow/operation-workflow';
import {
  DriverPortalData,
  Operation,
  OperationContainerStatus,
  Vehicle,
} from '@/types/driver-portal.types';

interface CurrentTripTabProps {
  driver: DriverPortalData;
  assignedOperations: Operation[];
  activeOperation: Operation | undefined;
  onSelectOperation: (operationId: number) => void;
  vehiculo: Pick<Vehicle, 'plate'> | undefined;
  processingState: boolean;
  onUpdateState: (operationId: number, estadoViaje: string) => Promise<void>;
  onUpdateContainerStatus: (
    operationId: number,
    containerStatus: OperationContainerStatus,
    issueDescription?: string,
  ) => Promise<void>;
  onOpenOcrModal: () => void;
  onOpenClosingModal: () => void;
  onOpenDetailsModal: () => void;
}

export function CurrentTripTab({
  driver,
  assignedOperations,
  activeOperation,
  onSelectOperation,
  vehiculo,
  processingState,
  onUpdateState,
  onUpdateContainerStatus,
  onOpenOcrModal,
  onOpenClosingModal,
  onOpenDetailsModal,
}: CurrentTripTabProps) {
  const blockingOperations = activeOperation
    ? assignedOperations.filter(
        (operation) =>
          operation.id !== activeOperation.id &&
          operation.status === 'EN_CURSO',
      )
    : [];
  const blockingOperation = blockingOperations[0];
  const blockingOperationId =
    blockingOperations.length === 1 &&
    activeOperation?.type === 'IMPORTACION' &&
    blockingOperation?.id === activeOperation.amparoExportOperationId &&
    blockingOperation?.estadoViaje === 'RUMBO_AL_PUERTO'
      ? undefined
      : blockingOperation?.id;

  return (
    <div className={styles.gridLayout}>
      <section className={`${styles.infoCard} ${styles.operationsListCard}`}>
        <div className={styles.operationsListHeader}>
          <div>
            <h2>Operaciones asignadas</h2>
            <p>Selecciona el viaje que vas a gestionar.</p>
          </div>
          <span className={styles.operationCount}>{assignedOperations.length}</span>
        </div>
        {assignedOperations.length ? (
          <div className={styles.operationsList}>
            {assignedOperations.map((operation) => (
              <button
                key={operation.id}
                type="button"
                aria-pressed={operation.id === activeOperation?.id}
                onClick={() => onSelectOperation(operation.id)}
                className={`${styles.operationListItem} ${
                  operation.id === activeOperation?.id ? styles.operationListItemSelected : ''
                }`}
              >
                <span className={styles.operationListMain}>
                  <strong>Operación #{operation.id} · {operation.type || 'Viaje'}</strong>
                  <span>{operation.clientName || 'Cliente por confirmar'}</span>
                  <span>
                    {operation.vehicle?.plate || operation.vehiclePlate || 'Vehículo sin placa'}
                    {' · '}
                    {operation.estadoViaje?.replace(/_/g, ' ') || operation.status || 'ASIGNADO'}
                  </span>
                  <span>
                    Contenedor: {(operation.containerStatus || 'PENDIENTE').replace(/_/g, ' ')}
                  </span>
                </span>
                <span
                  className={`${styles.operationAccessBadge} ${
                    operation.isActive ? styles.operationAccessEnabled : styles.operationAccessDisabled
                  }`}
                >
                  {operation.isActive ? 'Habilitada' : 'Deshabilitada'}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>No tienes operaciones asignadas en este momento.</p>
        )}
      </section>

      <div className={styles.infoCard}>
        <div className={styles.vehicleHeader}>
          <div className={styles.truckIconBox}>🚛</div>
          <div className={styles.truckData}>
            <h2>{vehiculo?.plate || 'SIN ASIGNAR'}</h2>
            <p>Conductor: {driver.name}</p>
          </div>
          {activeOperation && (
            <span
              className={
                activeOperation.isActive
                  ? styles.statusBadgeGreen
                  : styles.statusBadgeRed
              }
            >
              {activeOperation.isActive ? 'Habilitada' : 'Deshabilitada'}
            </span>
          )}
        </div>

        <hr className={styles.divider} />

        <div className={styles.tripDetails}>
          <h3 style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '12px' }}>VIAJE ACTUAL</h3>
          {activeOperation ? (
            <div className={styles.tripDataGrid}>
              <span className={styles.label}>Cliente</span>
              <span className={styles.value}>
                {activeOperation.clientName || 'Gamalog'} ({activeOperation.clientLocationName || 'Sede'})
              </span>
              
              <span className={styles.label}>Ruta</span>
              <span className={styles.value}>
                {activeOperation.origenName || 'Origen'} ➡️ {activeOperation.clientName || 'Cliente'} ➡️ {activeOperation.destinoName || 'Patio'}
              </span>

              <span className={styles.label}>Pago Estimado</span>
              <span className={styles.value} style={{ color: '#059669', fontWeight: 'bold', fontSize: '1.1rem' }}>
                ${Number(activeOperation.fletePago || 0).toLocaleString('es-CO')}
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
        {activeOperation?.isActive ? (
          <OperationWorkflow
            key={`${activeOperation.id}-${activeOperation.containerStatus || 'PENDIENTE'}`}
            operation={activeOperation}
            isLoading={processingState}
            blockingOperationId={blockingOperationId}
            onUpdateState={onUpdateState}
            onUpdateContainerStatus={onUpdateContainerStatus}
            onOpenOcrModal={onOpenOcrModal}
            onOpenClosingModal={onOpenClosingModal}
          />
        ) : activeOperation ? (
          <div className={styles.emptyWorkflow}>
            <span style={{ fontSize: '2rem' }}>⏸️</span>
            <p style={{ color: '#64748b', marginTop: '12px' }}>
              Esta operación está deshabilitada por el analista.
            </p>
          </div>
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