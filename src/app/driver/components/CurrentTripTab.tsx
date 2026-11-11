// src/app/driver/components/CurrentTripTab.tsx
"use client";

import React from "react";
import styles from "../driver.module.css";
import { OperationWorkflow } from "./workflow/operation-workflow";
import {
  DriverPortalData,
  Operation,
  OperationContainerStatus,
  CargoStatus,
  TrailerDestinationType,
  Vehicle,
} from "@/types/driver-portal.types";
import { generateDriverOperationRoute } from "@/utils/driver-operation-route";

interface CurrentTripTabProps {
  driver: DriverPortalData;
  assignedOperations: Operation[];
  activeOperation: Operation | undefined;
  onSelectOperation: (operationId: number) => void;
  vehiculo: Pick<Vehicle, "plate"> | undefined;
  processingState: boolean;
  onUpdateState: (operationId: number, estadoViaje: string) => Promise<void>;
  onUpdateContainerStatus: (
    operationId: number,
    containerStatus: OperationContainerStatus,
    issueDescription?: string,
  ) => Promise<void>;
  onUpdateCargoStatus: (
    operationId: number,
    cargoStatus: CargoStatus,
  ) => Promise<void>;
  onCompleteStop: (operationId: number, stopId: number) => Promise<void>;
  onUpdateSealNumber: (
    operationId: number,
    sealNumber: string,
  ) => Promise<void>;
  onReportDeviation: () => void;
  onReportExtra: (operationId: number) => void;
  onOpenOcrModal: () => void;
  onOpenPlateVerification: () => void;
  onOpenEvidenceModal: (
    operationId: number,
    evidenceTypes: string[],
    nextState?: string,
  ) => void;
  onOpenClosingModal: () => void;
  onOpenDetailsModal: () => void;
  onReportTrailerLocation: (
    operationId: number,
    destinationType: TrailerDestinationType,
  ) => void;
  isUncouplingTrailer: boolean;
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
  onUpdateCargoStatus,
  onCompleteStop,
  onUpdateSealNumber,
  onReportDeviation,
  onReportExtra,
  onOpenOcrModal,
  onOpenPlateVerification,
  onOpenEvidenceModal,
  onOpenClosingModal,
  onOpenDetailsModal,
  onReportTrailerLocation,
  isUncouplingTrailer,
}: CurrentTripTabProps) {
  const deviationOcr =
    activeOperation?.historialNovedades?.[0]?.metadata?.comodatoOcr;
  const isAmparoImportBlocked = (operation: Operation) =>
    operation.type === "IMPORTACION" &&
    Boolean(operation.amparoExportOperationId) &&
    operation.amparoExportFinished !== true;
  const blockingOperations = activeOperation
    ? assignedOperations.filter(
        (operation) =>
          operation.id !== activeOperation.id &&
          operation.isActive &&
          operation.status === "EN_CURSO" &&
          !isAmparoImportBlocked(operation),
      )
    : [];
  // Una impo amparada que espera el cierre de su expo no debe bloquear el inicio de esa expo.
  // Las demás operaciones en curso sí bloquean viajes asignados.
  const blockingOperationId = blockingOperations[0]?.id;

  return (
    <div className={styles.gridLayout}>
      <section className={`${styles.infoCard} ${styles.operationsListCard}`}>
        <div className={styles.operationsListHeader}>
          <div>
            <h2>Operaciones asignadas</h2>
            <p>Selecciona el viaje que vas a gestionar.</p>
          </div>
          <span className={styles.operationCount}>
            {assignedOperations.length}
          </span>
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
                  operation.id === activeOperation?.id
                    ? styles.operationListItemSelected
                    : ""
                }`}
              >
                <span className={styles.operationListMain}>
                  <strong>
                    Operación #{operation.id} · {operation.type || "Viaje"}
                  </strong>
                  <span>{operation.clientName || "Cliente por confirmar"}</span>
                  <span>
                    {operation.vehicle?.plate ||
                      operation.vehiclePlate ||
                      "Vehículo sin placa"}
                    {" · "}
                    {operation.estadoViaje?.replace(/_/g, " ") ||
                      operation.status ||
                      "ASIGNADO"}
                  </span>
                  <span>
                    {operation.isContainerized === false
                      ? "Carga suelta"
                      : `Contenedor: ${(operation.containerStatus || "PENDIENTE").replace(/_/g, " ")}`}
                  </span>
                </span>
                <span
                  className={`${styles.operationAccessBadge} ${
                    operation.isActive && !isAmparoImportBlocked(operation)
                      ? styles.operationAccessEnabled
                      : styles.operationAccessDisabled
                  }`}
                >
                  {isAmparoImportBlocked(operation)
                    ? "Esperando exportación"
                    : operation.isActive ? "Habilitada" : "Deshabilitada"}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>
            No tienes operaciones asignadas en este momento.
          </p>
        )}
      </section>

      <div className={styles.infoCard}>
        <div className={styles.vehicleHeader}>
          <div className={styles.truckIconBox}>🚛</div>
          <div className={styles.truckData}>
            <h2>{vehiculo?.plate || "SIN ASIGNAR"}</h2>
            <p>Conductor: {driver.name}</p>
          </div>
          {activeOperation && (
            <span
              className={
                activeOperation.isActive && !isAmparoImportBlocked(activeOperation)
                  ? styles.statusBadgeGreen
                  : styles.statusBadgeRed
              }
            >
              {isAmparoImportBlocked(activeOperation)
                ? "Esperando exportación"
                : activeOperation.isActive ? "Habilitada" : "Deshabilitada"}
            </span>
          )}
        </div>

        <hr className={styles.divider} />

        <div className={styles.tripDetails}>
          <h3
            style={{
              fontSize: "0.85rem",
              color: "#64748b",
              marginBottom: "12px",
            }}
          >
            VIAJE ACTUAL
          </h3>
          {activeOperation ? (
            <div className={styles.tripDataGrid}>
              <span className={styles.label}>Cliente</span>
              <span className={styles.value}>
                {activeOperation.customer?.name ||
                  activeOperation.clientName ||
                  "Gamalog"} (
                {activeOperation.clientLocationName || "Sede"})
              </span>

              <span className={styles.label}>Ruta</span>
              <span className={styles.value}>
                {generateDriverOperationRoute(activeOperation)}
              </span>
              {activeOperation.fechaCitaDesvio && (
                <>
                  <span className={styles.label}>Cita de devolución</span>
                  <span className={styles.value}>
                    {new Date(activeOperation.fechaCitaDesvio).toLocaleString(
                      "es-CO",
                    )}
                  </span>
                </>
              )}
              {activeOperation.containerStatus === "PENDIENTE_DEVOLUCION" && (
                <div
                  role="status"
                  style={{
                    gridColumn: "1 / -1",
                    padding: 12,
                    borderRadius: 8,
                    background: "#fff7ed",
                    color: "#9a3412",
                  }}
                >
                  <strong>
                    {activeOperation.nuevoDestino?.name
                      ? "Desvío confirmado por el analista"
                      : "Devolución pendiente de confirmación"}
                  </strong>
                  <p>
                    {activeOperation.status === "PAUSADA"
                      ? "El viaje está en pausa hasta que el analista confirme el destino y la cita."
                      : "Continúa al destino y en la cita confirmados por el analista."}
                  </p>
                  {deviationOcr?.legible ? (
                    <>
                      {deviationOcr.destino && (
                        <p>
                          Destino que aparece en el comodato (sugerencia IA, por
                          confirmar): {deviationOcr.destino}
                        </p>
                      )}
                      {deviationOcr.fechaCita && (
                        <p>
                          Cita que aparece en el comodato:{" "}
                          {deviationOcr.fechaCita}
                        </p>
                      )}
                      {deviationOcr.numeroContenedor && (
                        <p>Contenedor leído: {deviationOcr.numeroContenedor}</p>
                      )}
                      {deviationOcr.referencia && (
                        <p>
                          Referencia del comodato: {deviationOcr.referencia}
                        </p>
                      )}
                    </>
                  ) : (
                    <p>
                      No fue posible extraer datos del comodato automáticamente;
                      el analista revisará la evidencia.
                    </p>
                  )}
                </div>
              )}
              <span className={styles.label}>Pago Estimado</span>
              <span
                className={styles.value}
                style={{
                  color: "#059669",
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                }}
              >
                $
                {Number(activeOperation.fleteAPagar || 0).toLocaleString(
                  "es-CO",
                )}
              </span>
            </div>
          ) : (
            <p className={styles.emptyState}>
              No tienes viajes asignados en este momento.
            </p>
          )}
        </div>

        {activeOperation && (
          <>
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
            {activeOperation.isActive &&
              !isAmparoImportBlocked(activeOperation) &&
              activeOperation.trailer &&
              activeOperation.vehicle?.currentTrailerId ===
                activeOperation.trailer.id && (
                <>
                  <div className={styles.trailerLocationActions}>
                    <button
                      type="button"
                      className={`${styles.uncoupleTrailerButton} ${styles.trailerClientButton}`}
                      onClick={() =>
                        onReportTrailerLocation(activeOperation.id, "CLIENT")
                      }
                      disabled={
                        isUncouplingTrailer ||
                        !activeOperation.trailerClientLocation ||
                        !activeOperation.clientId
                      }
                    >
                      Desenganchar en Cliente
                    </button>
                    <button
                      type="button"
                      className={`${styles.uncoupleTrailerButton} ${styles.trailerYardButton}`}
                      onClick={() =>
                        onReportTrailerLocation(activeOperation.id, "OWN_YARD")
                      }
                      disabled={
                        isUncouplingTrailer ||
                        !activeOperation.trailerOwnYards?.length
                      }
                    >
                      Dejar en Patio Propio
                    </button>
                  </div>
                  {isUncouplingTrailer && (
                    <p className={styles.trailerLocationStatus}>
                      Reportando ubicación del tráiler…
                    </p>
                  )}
                </>
              )}
          </>
        )}
      </div>

      <div className={styles.sequenceCard}>
        {activeOperation && isAmparoImportBlocked(activeOperation) ? (
          <div className={styles.emptyWorkflow} role="status">
            <p>
              La importación está bloqueada hasta finalizar el descargue de la
              exportación amparada #{activeOperation.amparoExportOperationId} en
              puerto. Las fotos de placas se compartirán automáticamente.
            </p>
          </div>
        ) : activeOperation?.type === "IMPORTACION" &&
          activeOperation.amparoExportOperationId &&
          activeOperation.status === "ASIGNADO" ? (
          <div className={styles.emptyWorkflow} role="status">
            <p>
              La importación amparada debe habilitarse en puerto al cerrar la
              exportación. Contacta al analista para revisar su estado.
            </p>
          </div>
        ) : activeOperation?.isActive ? (
          <OperationWorkflow
            key={`${activeOperation.id}-${activeOperation.containerStatus || "PENDIENTE"}-${activeOperation.cargoStatus || "PENDIENTE"}-${activeOperation.sealNumber || ""}`}
            operation={activeOperation}
            isLoading={processingState}
            blockingOperationId={blockingOperationId}
            onUpdateState={onUpdateState}
            onUpdateContainerStatus={onUpdateContainerStatus}
            onUpdateCargoStatus={onUpdateCargoStatus}
            onCompleteStop={onCompleteStop}
            onUpdateSealNumber={onUpdateSealNumber}
            onReportDeviation={onReportDeviation}
            onReportExtra={onReportExtra}
            onOpenOcrModal={onOpenOcrModal}
            onOpenPlateVerification={onOpenPlateVerification}
            onOpenEvidenceModal={onOpenEvidenceModal}
            onOpenClosingModal={onOpenClosingModal}
          />
        ) : activeOperation ? (
          <div className={styles.emptyWorkflow}>
            <span style={{ fontSize: "2rem" }}>⏸️</span>
            <p style={{ color: "#64748b", marginTop: "12px" }}>
              Esta operación está deshabilitada por el analista.
            </p>
          </div>
        ) : (
          <div className={styles.emptyWorkflow}>
            <span style={{ fontSize: "2rem" }}>☕</span>
            <p style={{ color: "#64748b", marginTop: "12px" }}>
              Esperando asignación de viaje...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
