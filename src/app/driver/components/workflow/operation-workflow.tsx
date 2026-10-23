"use client";

import React, { useEffect, useState } from "react";
import styles from "./operation-workflow.module.css";
import { Button } from "@/components/atoms/button/button";
import { OperationContainerStatus } from "@/types/driver-portal.types";

const PORT_ENTRY_EVIDENCE = "INGRESO_PUERTO";
const SEAL_EVIDENCE = "SELLOS_CONTENEDOR";
const PORT_EXIT_EVIDENCE = "SALIDA_PUERTO";
const COMODATO_EVIDENCE = "COMODATO";
const LOADING_PHOTO_EVIDENCE = "FOTO_CARGUE";
const CONTAINER_NUMBER_EVIDENCE = "Número de contenedor";

interface OperationData {
  id: number;
  type?: string;
  estadoViaje?: string;
  status?: string;
  containerStatus?: OperationContainerStatus;
  containerStatusUpdatedAt?: string | null;
  containerIssueDescription?: string | null;
  scheduledAt?: string | null;
  fechaCitaOrigen?: string | null;
  fechaCitaDestino?: string | null;
  loadingStartedAt?: string | null;
  loadingCompletedAt?: string | null;
  unloadingStartedAt?: string | null;
  unloadingCompletedAt?: string | null;
  nuevoDestinoId?: number | null;
  nuevoDestino?: { name: string } | null;
  fechaCitaDesvio?: string | null;
  children?: Array<{
    id: number;
    type: string;
    destino?: { name: string } | null;
  }>;
  evidences?: Array<{
    id: number;
    type: string;
    estadoRevision: string;
    notaAnalista?: string | null;
  }>;
  isAmparado?: boolean;
}

interface OperationWorkflowProps {
  operation: OperationData;
  isLoading: boolean;
  blockingOperationId?: number;
  onUpdateState: (operationId: number, newState: string) => Promise<void>;
  onUpdateContainerStatus: (
    operationId: number,
    containerStatus: OperationContainerStatus,
    issueDescription?: string,
  ) => Promise<void>;
  onReportDeviation: () => void;
  onOpenOcrModal: () => void;
  onOpenEvidenceModal: (
    operationId: number,
    evidenceTypes: string[],
    nextState?: string,
  ) => void;
  onOpenClosingModal: () => void;
}

type WorkflowStep = {
  id: string;
  travelState: string;
  label: string;
  nextState?: string;
  action: "update" | "ocr" | "close" | "evidence";
  evidenceTypes?: string[];
  requiresEvidence?: string[];
  requiresContainerStatus?: OperationContainerStatus[];
  instruction?: string;
};

const TRAVEL_START_STATES = new Set([
  "RUMBO_AL_PUERTO",
  "RUMBO_AL_CLIENTE",
  "EN_RUTA_ORIGEN",
  "EN_RUTA_DESTINO",
]);

const IMPORT_STATE_ORDER = [
  "ASIGNADO",
  "RUMBO_AL_PUERTO",
  "EN_PUERTO",
  "RUMBO_AL_CLIENTE",
  "EN_CLIENTE",
  "EN_RUTA_DESTINO",
  "LLEGADA_DESTINO",
  "LLEGADA_ORIGEN",
  "FINALIZADO",
  "CONTENEDOR_LIBRE",
];

const EXPORT_STATE_ORDER = [
  "ASIGNADO",
  "EN_RUTA_ORIGEN",
  "LLEGADA_ORIGEN",
  "RUMBO_AL_CLIENTE",
  "EN_CLIENTE",
  "RUMBO_AL_PUERTO",
  "EN_PUERTO",
  "FINALIZADO",
  "CONTENEDOR_LIBRE",
];

function normalizeTravelState(state?: string): string {
  if (!state || state === "ASIGNADO") return "ASIGNADO";
  if (state === "EN_PUERTO_CARGADO") return "EN_PUERTO";
  return state;
}

function getTravelStartDate(
  operation: OperationData,
  nextState?: string,
): string | null {
  if (!nextState || !TRAVEL_START_STATES.has(nextState)) return null;
  if (
    nextState === "EN_RUTA_ORIGEN" &&
    operation.containerStatus === "PENDIENTE_DEVOLUCION"
  ) {
    return operation.fechaCitaDesvio ?? null;
  }
  if (nextState === "EN_RUTA_DESTINO") {
    return operation.fechaCitaDestino ?? operation.scheduledAt ?? null;
  }
  if (nextState === "RUMBO_AL_PUERTO") {
    if (operation.type === "EXPORTACION") {
      return operation.fechaCitaDestino ?? operation.scheduledAt ?? null;
    }
    return operation.fechaCitaOrigen ?? operation.scheduledAt ?? null;
  }
  if (nextState === "EN_RUTA_ORIGEN") {
    return operation.fechaCitaOrigen ?? operation.scheduledAt ?? null;
  }
  return operation.scheduledAt ?? null;
}

function isSameColombiaDate(scheduledAt: string | null, now: Date): boolean {
  if (!scheduledAt) return false;
  const appointmentDate = new Date(scheduledAt);
  if (Number.isNaN(appointmentDate.getTime())) return false;

  const dateKey = (date: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);

  return dateKey(appointmentDate) === dateKey(now);
}

function hasValidEvidence(operation: OperationData, type: string): boolean {
  return Boolean(
    operation.evidences?.some(
      (evidence) =>
        evidence.type === type && evidence.estadoRevision !== "DEVUELTO",
    ),
  );
}

function hasAllEvidence(operation: OperationData, types?: string[]): boolean {
  return (types ?? []).every((type) => hasValidEvidence(operation, type));
}

function isContainerReady(
  operation: OperationData,
  required?: OperationContainerStatus[],
): boolean {
  if (!required?.length) return true;
  return required.includes(operation.containerStatus || "PENDIENTE");
}

function isStepComplete(
  step: WorkflowStep,
  operation: OperationData,
  currentState: string,
  stateOrder: string[],
): boolean {
  const currentIndex = Math.max(0, stateOrder.indexOf(currentState));
  const stepIndex = stateOrder.indexOf(step.travelState);
  if (stepIndex < 0) return false;
  if (currentIndex > stepIndex) return true;
  if (currentIndex < stepIndex) return false;

  if (step.action === "ocr") {
    return hasValidEvidence(operation, CONTAINER_NUMBER_EVIDENCE);
  }
  if (step.action === "evidence" && !step.nextState) {
    return hasAllEvidence(operation, step.evidenceTypes);
  }
  return false;
}

const STANDARD_WORKFLOW_STEPS: WorkflowStep[] = [
  { id: "std-start", travelState: "ASIGNADO", label: "INICIAR VIAJE AL PUERTO", nextState: "RUMBO_AL_PUERTO", action: "update" },
  { id: "std-arrive", travelState: "RUMBO_AL_PUERTO", label: "REPORTAR LLEGADA A PUERTO", nextState: "EN_PUERTO", action: "update" },
  { id: "std-ocr", travelState: "EN_PUERTO", label: "ESCANEAR CARGUE (OCR)", action: "ocr" },
  { id: "std-client", travelState: "EN_PUERTO", label: "INICIAR RUTA A CLIENTE", nextState: "RUMBO_AL_CLIENTE", action: "update" },
  { id: "std-arrive-client", travelState: "RUMBO_AL_CLIENTE", label: "LLEGADA A CLIENTE", nextState: "EN_CLIENTE", action: "update" },
  { id: "std-close", travelState: "EN_CLIENTE", label: "SOPORTE Y FINALIZAR", nextState: "FINALIZADO", action: "close" },
];

const IMPORT_TO_YARD_STEPS: WorkflowStep[] = [
  { id: "impo-start", travelState: "ASIGNADO", label: "INICIAR VIAJE AL PUERTO", nextState: "RUMBO_AL_PUERTO", action: "update" },
  {
    id: "impo-arrive-port",
    travelState: "RUMBO_AL_PUERTO",
    label: "SUBIR ARIN DE INGRESO Y REPORTAR LLEGADA",
    nextState: "EN_PUERTO",
    action: "evidence",
    evidenceTypes: [PORT_ENTRY_EVIDENCE],
  },
  {
    id: "impo-ocr",
    travelState: "EN_PUERTO",
    label: "ESCANEAR CONTENEDOR (OCR)",
    action: "ocr",
    requiresContainerStatus: ["EN_CARGUE", "CARGADO"],
    instruction: "Antes de escanear, reporta el estado del contenedor como EN CARGUE.",
  },
  {
    id: "impo-seals",
    travelState: "EN_PUERTO",
    label: "SUBIR FOTOS DE LOS SELLOS",
    action: "evidence",
    evidenceTypes: [SEAL_EVIDENCE],
    requiresEvidence: [CONTAINER_NUMBER_EVIDENCE],
    requiresContainerStatus: ["CARGADO"],
    instruction: "El contenedor ya debe estar montado: márcalo como CARGADO y luego sube las fotos de los sellos.",
  },
  {
    id: "impo-leave-port",
    travelState: "EN_PUERTO",
    label: "SUBIR ARIN DE SALIDA E INICIAR RUTA A CLIENTE",
    nextState: "RUMBO_AL_CLIENTE",
    action: "evidence",
    evidenceTypes: [PORT_EXIT_EVIDENCE],
    requiresEvidence: [SEAL_EVIDENCE, CONTAINER_NUMBER_EVIDENCE],
    requiresContainerStatus: ["CARGADO"],
  },
  { id: "impo-arrive-client", travelState: "RUMBO_AL_CLIENTE", label: "REPORTAR LLEGADA AL CLIENTE", nextState: "EN_CLIENTE", action: "update" },
  {
    id: "impo-to-yard",
    travelState: "EN_CLIENTE",
    label: "INICIAR TRASLADO AL PATIO DE VACÍOS",
    nextState: "EN_RUTA_DESTINO",
    action: "update",
    requiresContainerStatus: ["DESCARGADO", "EN_PISO"],
    instruction: "Antes de ir al patio, reporta el descargue en el cliente (DESCARGADO o bajado a piso).",
  },
  { id: "impo-arrive-yard", travelState: "EN_RUTA_DESTINO", label: "REPORTAR LLEGADA AL PATIO", nextState: "LLEGADA_DESTINO", action: "update" },
  {
    id: "impo-close",
    travelState: "LLEGADA_DESTINO",
    label: "SUBIR COMODATO DE DEVOLUCIÓN Y FINALIZAR",
    nextState: "FINALIZADO",
    action: "evidence",
    evidenceTypes: [COMODATO_EVIDENCE],
  },
];

const EXPORT_STEPS: WorkflowStep[] = [
  { id: "expo-start", travelState: "ASIGNADO", label: "INICIAR VIAJE AL PATIO DE VACÍOS", nextState: "EN_RUTA_ORIGEN", action: "update" },
  { id: "expo-arrive-yard", travelState: "EN_RUTA_ORIGEN", label: "REPORTAR LLEGADA AL PATIO DE VACÍOS", nextState: "LLEGADA_ORIGEN", action: "update" },
  { id: "expo-ocr", travelState: "LLEGADA_ORIGEN", label: "ESCANEAR CONTENEDOR VACÍO (OCR)", action: "ocr" },
  {
    id: "expo-comodato",
    travelState: "LLEGADA_ORIGEN",
    label: "SUBIR DOCUMENTO DE COMODATO",
    action: "evidence",
    evidenceTypes: [COMODATO_EVIDENCE],
    requiresEvidence: [CONTAINER_NUMBER_EVIDENCE],
  },
  {
    id: "expo-to-client",
    travelState: "LLEGADA_ORIGEN",
    label: "INICIAR RUTA A CLIENTE",
    nextState: "RUMBO_AL_CLIENTE",
    action: "update",
    requiresEvidence: [CONTAINER_NUMBER_EVIDENCE, COMODATO_EVIDENCE],
  },
  { id: "expo-arrive-client", travelState: "RUMBO_AL_CLIENTE", label: "REPORTAR LLEGADA A CLIENTE", nextState: "EN_CLIENTE", action: "update" },
  {
    id: "expo-loading-photo",
    travelState: "EN_CLIENTE",
    label: "SUBIR FOTO CARGANDO EL CONTENEDOR",
    action: "evidence",
    evidenceTypes: [LOADING_PHOTO_EVIDENCE],
    instruction: "Toma la foto del cargue y reporta el estado del contenedor como EN CARGUE.",
  },
  {
    id: "expo-to-port",
    travelState: "EN_CLIENTE",
    label: "INICIAR VIAJE AL PUERTO",
    nextState: "RUMBO_AL_PUERTO",
    action: "update",
    requiresEvidence: [LOADING_PHOTO_EVIDENCE],
    requiresContainerStatus: ["EN_CARGUE", "CARGADO"],
    instruction: "Antes de salir al puerto, el contenedor debe estar EN CARGUE.",
  },
  {
    id: "expo-arrive-port",
    travelState: "RUMBO_AL_PUERTO",
    label: "SUBIR ARIN DE INGRESO Y REPORTAR LLEGADA",
    nextState: "EN_PUERTO",
    action: "evidence",
    evidenceTypes: [PORT_ENTRY_EVIDENCE],
  },
  {
    id: "expo-close",
    travelState: "EN_PUERTO",
    label: "SUBIR ARIN DE SALIDA Y FINALIZAR",
    nextState: "FINALIZADO",
    action: "evidence",
    evidenceTypes: [PORT_EXIT_EVIDENCE],
    requiresEvidence: [PORT_ENTRY_EVIDENCE],
    requiresContainerStatus: ["DESCARGADO"],
    instruction: "Entrega el contenedor en puerto: márcalo como DESCARGADO y luego sube el ARIN de salida.",
  },
];

const AMPARADO_EXPORT_STEPS: WorkflowStep[] = EXPORT_STEPS.map((step) =>
  step.id === "expo-close"
    ? {
        ...step,
        id: "amparo-expo-close",
        label: "SUBIR ARIN DE INTERCAMBIO Y CONTINUAR",
      }
    : { ...step, id: `amparo-${step.id}` },
);

const AMPARADO_IMPORT_STEPS: WorkflowStep[] = [
  {
    id: "amparo-impo-ocr",
    travelState: "EN_PUERTO",
    label: "ESCANEAR NUEVO CONTENEDOR (OCR)",
    action: "ocr",
    requiresContainerStatus: ["EN_CARGUE", "CARGADO"],
    instruction: "Estás en puerto por triangulación. Reporta EN CARGUE y escanea el nuevo contenedor.",
  },
  {
    id: "amparo-impo-seals",
    travelState: "EN_PUERTO",
    label: "SUBIR FOTOS DE LOS SELLOS",
    action: "evidence",
    evidenceTypes: [SEAL_EVIDENCE],
    requiresEvidence: [CONTAINER_NUMBER_EVIDENCE],
    requiresContainerStatus: ["CARGADO"],
    instruction: "Marca el contenedor como CARGADO y sube las fotos de los sellos.",
  },
  {
    id: "amparo-impo-leave-port",
    travelState: "EN_PUERTO",
    label: "SUBIR SOPORTE DE SALIDA (SALIDA_PUERTO)",
    action: "evidence",
    evidenceTypes: [PORT_EXIT_EVIDENCE],
    requiresEvidence: [SEAL_EVIDENCE, CONTAINER_NUMBER_EVIDENCE],
    requiresContainerStatus: ["CARGADO"],
    instruction: "Sube el soporte de salida del puerto para habilitar la ruta al cliente.",
  },
  {
    id: "amparo-impo-to-client",
    travelState: "EN_PUERTO",
    label: "INICIAR RUTA A CLIENTE",
    nextState: "RUMBO_AL_CLIENTE",
    action: "update",
    // 🚀 Aseguramos que requiera la evidencia de salida antes de iniciar ruta
    requiresEvidence: [PORT_EXIT_EVIDENCE, SEAL_EVIDENCE, CONTAINER_NUMBER_EVIDENCE],
    requiresContainerStatus: ["CARGADO"],
  },
  ...IMPORT_TO_YARD_STEPS.filter((step) =>
    ["impo-arrive-client", "impo-to-yard", "impo-arrive-yard", "impo-close"].includes(step.id),
  ).map((step) => ({ ...step, id: `amparo-${step.id}` })),
];

const PENDING_RETURN_STEPS: WorkflowStep[] = [
  { id: "return-start", travelState: "LLEGADA_DESTINO", label: "INICIAR TRASLADO AL DESTINO CONFIRMADO", nextState: "EN_RUTA_ORIGEN", action: "update" },
  { id: "return-arrive", travelState: "EN_RUTA_ORIGEN", label: "REPORTAR LLEGADA AL DESTINO CONFIRMADO", nextState: "LLEGADA_ORIGEN", action: "update" },
  { id: "return-close", travelState: "LLEGADA_ORIGEN", label: "SUBIR SOPORTE Y FINALIZAR DEVOLUCIÓN", nextState: "FINALIZADO", action: "close" },
];

export function OperationWorkflow({
  operation,
  isLoading,
  blockingOperationId,
  onUpdateState,
  onUpdateContainerStatus,
  onReportDeviation,
  onOpenOcrModal,
  onOpenEvidenceModal,
  onOpenClosingModal,
}: OperationWorkflowProps) {
  const [selectedContainerStatus, setSelectedContainerStatus] = useState<OperationContainerStatus>(operation.containerStatus || "PENDIENTE");
  const [issueDescription, setIssueDescription] = useState("");
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const currentState = normalizeTravelState(operation.estadoViaje);
  const isFinished = operation.status === "FINALIZADO" || currentState === "FINALIZADO" || currentState === "CONTENEDOR_LIBRE";
  const stateOrder = operation.type === "EXPORTACION" ? EXPORT_STATE_ORDER : IMPORT_STATE_ORDER;

  let workflowSteps = STANDARD_WORKFLOW_STEPS;

  if (operation.type === "IMPORTACION") {
    if (operation.containerStatus === "PENDIENTE_DEVOLUCION") {
      workflowSteps = PENDING_RETURN_STEPS;
    } else if (operation.isAmparado) {
      workflowSteps = AMPARADO_IMPORT_STEPS;
    } else {
      workflowSteps = IMPORT_TO_YARD_STEPS;
    }
  } else if (operation.type === "EXPORTACION") {
    workflowSteps = operation.isAmparado ? AMPARADO_EXPORT_STEPS : EXPORT_STEPS;
  }

  const currentIndex = isFinished
    ? workflowSteps.length
    : Math.max(
        0,
        workflowSteps.findIndex(
          (step) => !isStepComplete(step, operation, currentState, stateOrder),
        ),
      );
  const activeStep = isFinished ? undefined : workflowSteps[currentIndex];
  const travelStartDate = getTravelStartDate(operation, activeStep?.nextState);
  const isTravelStartBlocked =
    Boolean(activeStep?.nextState) &&
    TRAVEL_START_STATES.has(activeStep?.nextState ?? "") &&
    !isSameColombiaDate(travelStartDate, currentTime);
  const isWaitingForDeviationConfirmation =
    operation.status === "PAUSADA" &&
    operation.containerStatus === "PENDIENTE_DEVOLUCION" &&
    (!operation.nuevoDestinoId || !operation.fechaCitaDesvio);

  // 🚀 FLEXIBILIZADO PARA EVITAR QUE SE BLOQUEEN LAS OPCIONES DEL SELECT
  const canReportContainerStatus = (nextStatus: OperationContainerStatus): boolean => {
    return true; 
  };

  const handleAction = (step: WorkflowStep) => {
    if (step.action === "ocr") onOpenOcrModal();
    else if (step.action === "close") onOpenClosingModal();
    else if (step.action === "evidence") {
      onOpenEvidenceModal(operation.id, step.evidenceTypes ?? [], step.nextState);
    } else if (step.nextState) {
      void onUpdateState(operation.id, step.nextState).catch(() => undefined);
    }
  };

  const formatTimestamp = (value?: string | null) =>
    value
      ? new Date(value).toLocaleString("es-CO", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Pendiente";

  return (
    <div className={styles.workflowContainer}>
      {operation.isAmparado && (
        <div className={styles.amparoBanner}>
          <span>🔄</span> OPERACIÓN DE DOBLE MOVIMIENTO (AMPARADA)
        </div>
      )}

      <section className={styles.containerStatusSection}>
        <h3 className={styles.title}>ESTADO DEL CONTENEDOR</h3>
        <p className={styles.containerStatusCurrent}>
          Estado actual:{" "}
          <strong>{(operation.containerStatus || "PENDIENTE").replace(/_/g, " ")}</strong>
        </p>
        {activeStep?.instruction && (
          <p className={styles.containerHint} role="status">
            {activeStep.instruction}
          </p>
        )}
        <label className={styles.containerStatusLabel} htmlFor={`container-status-${operation.id}`}>
          Reportar estado en campo
        </label>
        <select
          id={`container-status-${operation.id}`}
          className={styles.containerStatusSelect}
          value={selectedContainerStatus}
          onChange={(event) =>
            setSelectedContainerStatus(event.target.value as OperationContainerStatus)
          }
          disabled={isLoading}
        >
          <option value="PENDIENTE">Pendiente</option>
          <option value="EN_PISO">Bajado a piso</option>
          <option value="PENDIENTE_DEVOLUCION" disabled>Pendiente de devolución</option>
          <option value="EN_INSPECCION">En inspección</option>
          <option value="FALLA_REPORTADA">Presenta una falla</option>
          <option value="EN_CARGUE">Iniciar cargue (EN CARGUE)</option>
          <option value="CARGADO">Cargue finalizado (CARGADO)</option>
          <option value="EN_DESCARGUE">Iniciar descargue</option>
          <option value="DESCARGADO">Descargue finalizado (DESCARGADO)</option>
        </select>
        {selectedContainerStatus === "FALLA_REPORTADA" && (
          <textarea
            className={styles.issueDescription}
            value={issueDescription}
            onChange={(event) => setIssueDescription(event.target.value)}
            maxLength={1000}
            placeholder="Describe la falla encontrada"
            disabled={isLoading}
          />
        )}
        <Button
          variant="primary"
          isLoading={isLoading}
          disabled={isLoading || (selectedContainerStatus === "FALLA_REPORTADA" && !issueDescription.trim())}
          onClick={() =>
            onUpdateContainerStatus(
              operation.id,
              selectedContainerStatus,
              selectedContainerStatus === "FALLA_REPORTADA"
                ? issueDescription.trim()
                : undefined,
            )
          }
        >
          Reportar estado
        </Button>
        {operation.type === "IMPORTACION" &&
          currentState === "LLEGADA_DESTINO" &&
          ["EN_INSPECCION", "FALLA_REPORTADA"].includes(operation.containerStatus || "") && (
            <Button variant="secondary" disabled={isLoading} onClick={onReportDeviation}>
              Reportar desvío
            </Button>
          )}
        <div className={styles.containerTimes}>
          <p>Cargue: {formatTimestamp(operation.loadingStartedAt)} — {formatTimestamp(operation.loadingCompletedAt)}</p>
          <p>Descargue: {formatTimestamp(operation.unloadingStartedAt)} — {formatTimestamp(operation.unloadingCompletedAt)}</p>
        </div>
      </section>

      <div className={styles.header}>
        <h3 className={styles.title}>SECUENCIA DEL VIAJE</h3>
        <span className={styles.stepCounter}>
          Paso {Math.min(currentIndex + 1, workflowSteps.length)} de {workflowSteps.length}
        </span>
      </div>

      <div className={styles.progressTracker}>
        {workflowSteps.map((_, index) => (
          <React.Fragment key={index}>
            <div
              className={`${styles.dot} ${
                index < currentIndex
                  ? styles.dotCompleted
                  : index === currentIndex
                    ? styles.dotActive
                    : ""
              }`}
            />
            {index < workflowSteps.length - 1 && (
              <div className={`${styles.line} ${index < currentIndex ? styles.lineCompleted : ""}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className={styles.actionList}>
        {isTravelStartBlocked && (
          <p className={styles.startBlockedNotice} role="status">
            Solo puedes iniciar el viaje el{" "}
            {travelStartDate
              ? new Date(travelStartDate).toLocaleDateString("es-CO", {
                  timeZone: "America/Bogota",
                })
              : "día programado"}
            .
          </p>
        )}
        {workflowSteps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;
          const isLocked = index > currentIndex;
          const missingPrerequisites =
            isActive &&
            (!isContainerReady(operation, step.requiresContainerStatus) ||
              !hasAllEvidence(operation, step.requiresEvidence));

          const isBlockedByOtherOperation =
            isActive &&
            currentState === "ASIGNADO" &&
            operation.status !== "EN_CURSO" &&
            blockingOperationId !== undefined;

          const rejectedEvidences =
            operation.evidences?.filter(
              (ev) =>
                step.evidenceTypes?.includes(ev.type) && ev.estadoRevision === "DEVUELTO",
            ) || [];
          const hasRejectedEvidence = rejectedEvidences.length > 0;
          const rejectedNote = rejectedEvidences
            .map((ev) => ev.notaAnalista)
            .filter(Boolean)
            .join(" / ");

          const isClickable = isActive || hasRejectedEvidence || isLocked;
          const isDisabled =
            isLoading ||
            isBlockedByOtherOperation ||
            isWaitingForDeviationConfirmation;

          return (
            <div key={step.id} className={styles.stepWrapper}>
              <button
                className={`${styles.stepBtn} ${
                  hasRejectedEvidence
                    ? styles.rejectedBtn
                    : isBlockedByOtherOperation
                      ? styles.lockedBtn
                      : isActive
                        ? styles.activeBtn
                        : isCompleted
                          ? styles.completedBtn
                          : styles.lockedBtn
                }`}
                disabled={isDisabled}
                onClick={() => isClickable && handleAction(step)}
              >
                <span className={styles.stepIcon}>
                  {hasRejectedEvidence ? "⚠️" : isCompleted ? "✅" : isActive ? "▶" : "🔒"}
                </span>
                {step.label}
              </button>
              {isActive && step.instruction && (
                <p className={styles.stepInstruction} role="status">
                  {step.instruction}
                </p>
              )}
              {hasRejectedEvidence && (
                <p role="alert" className={styles.rejectedNotice}>
                  <strong>Soporte devuelto:</strong>{" "}
                  {rejectedNote || "La evidencia no es válida, vuelve a subirla."}
                </p>
              )}
            </div>
          );
        })}
        {isFinished && (
          <div className={styles.finalizedState}>
            <span>🎉</span> VIAJE FINALIZADO
          </div>
        )}
      </div>
    </div>
  );
}