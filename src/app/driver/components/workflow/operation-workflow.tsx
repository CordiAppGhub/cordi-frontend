"use client";

import React, { useEffect, useState } from "react";
import styles from "./operation-workflow.module.css";
import { Button } from "@/components/atoms/button/button";
import { ContainerRollback } from "./container-rollback";
import type {
  CargoStatus,
  OperationContainerStatus,
} from "@/types/driver-portal.types";
import {
  formatEvidenceTypeLabel,
  formatOperationStateLabel,
} from "@/utils/format-labels";
import { getMissingMandatoryAppointments } from "./workflow-guards";
import {
  buildWorkflowSteps,
  getWorkflowFamily,
} from "./workflow-steps.builder";
import { WorkflowStepCard } from "./components/WorkflowStepCard";

const PORT_ENTRY_EVIDENCE = "INGRESO_PUERTO";
const SEAL_EVIDENCE = "SELLOS_CONTENEDOR";
const PORT_EXIT_EVIDENCE = "SALIDA_PUERTO";
const COMODATO_EVIDENCE = "COMODATO";
const TIRILLA_EIR_EVIDENCE = "TIRILLA_EIR";
const LOADING_PHOTO_EVIDENCE = "FOTO_CARGUE";
const CONTAINER_NUMBER_EVIDENCE = "Número de contenedor";
const CONTAINER_OCR_EVIDENCE_TYPES = [
  CONTAINER_NUMBER_EVIDENCE,
  "NUMERO_CONTENEDOR",
  "FOTO_CONTENEDOR",
];
const LOOSE_CARGO_EVIDENCE = "EVIDENCIA_CARGA_SUELTA";
const LOOSE_CARGO_ARRIVAL_EVIDENCE = "FOTOS_LLEGADA_CARGA_SUELTA";
const LOOSE_CARGO_UNLOADING_EVIDENCE = "FOTOS_DESCARGUE_CARGA_SUELTA";
const DELIVERY_DOC_EVIDENCE = "DELIVERY_DOC";
const CLOSING_EVIDENCE = "Soporte de cierre";
const CAB_PLATE_EVIDENCE = "VERIFICACION_PLACA_CABEZOTE";
const TRAILER_PLATE_EVIDENCE = "VERIFICACION_PLACA_TRAILER";

interface OperationData {
  id: number;
  type?: string;
  isAnticipada?: boolean;
  isContainerized?: boolean;
  cargoDescription?: string | null;
  weight?: number | null;
  dimensions?: string | null;
  estadoViaje?: string | null;
  status?: string;
  containerStatus?: OperationContainerStatus;
  cargoStatus?: CargoStatus;
  containerStatusUpdatedAt?: string | null;
  containerNumber?: string | null;
  sealNumber?: string | null;
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
  stops?: Array<{
    id: number;
    clientId: number;
    locationId: number | null;
    isCustomAddress?: boolean;
    address?: string | null;
    contactName?: string | null;
    contactPhone?: string | null;
    observations?: string | null;
    stopType: "CARGUE" | "DESCARGUE";
    stopOrder: number;
    cargoDescription?: string | null;
    weightKg?: number | null;
    actualArrivalAt?: string | null;
    actualDepartureAt?: string | null;
    completedAt?: string | null;
    status: string;
    client: { razonSocial: string };
    location: { name: string; address?: string | null } | null;
  }>;
  evidences?: Array<{
    id: number;
    type: string;
    estadoRevision: string;
    notaAnalista?: string | null;
    etapa?: string | null;
  }>;
  trailer?: { plate: string };
  isAmparado?: boolean;
  amparoExportOperationId?: number | null;
  amparoExportFinished?: boolean | null;
  pairedAmparoOperation?: {
    id: number;
    type: string;
    status: string;
    estadoViaje: string | null;
    numeroPedido: string | null;
    containerNumber: string | null;
    containerType: string | null;
    containerStatus: string | null;
    scheduledAt: string | null;
    clientName: string;
    origenName: string;
    destinoName: string;
  } | null;
  origen?: { name: string; isPort?: boolean } | null;
  destino?: { name: string; isPort?: boolean } | null;
}

interface OperationWorkflowProps {
  operation: OperationData;
  containerCardRef: React.RefObject<HTMLElement | null>;
  isLoading: boolean;
  blockingOperationId?: number;
  onUpdateState: (operationId: number, newState: string) => Promise<void>;
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
  onReportDeviation: (reason?: "AVERIA_NO_APTO" | "PATIO_LLENO") => void;
  onReportExtra: (operationId: number, defaultType?: "EN_PISO") => void;
  onOpenOcrModal: (containerStatus?: OperationContainerStatus) => void;
  onOpenPlateVerification: () => void;
  onOpenEvidenceModal: (
    operationId: number,
    evidenceTypes: string[],
    nextState?: string,
    beforeState?: string,
    containerStatus?: OperationContainerStatus,
  ) => void;
  onOpenExportSealModal: (
    operationId: number,
    containerStatus?: OperationContainerStatus,
  ) => void;
  onOpenClosingModal: () => void;
}

type WorkflowStep = {
  id: string;
  travelState: string;
  label: string;
  nextState?: string;
  action:
    | "update"
    | "ocr"
    | "close"
    | "evidence"
    | "verify-plates"
    | "container-status";
  containerStatus?: OperationContainerStatus;
  beforeState?: string;
  evidenceTypes?: string[];
  requiresEvidence?: string[];
  requiresEvidenceStage?: string;
  requiresEvidenceStages?: Partial<Record<string, string>>;
  evidenceStage?: string;
  requiresContainerStatus?: OperationContainerStatus[];
  requiresCargoStatus?: CargoStatus[];
  requiresSeal?: boolean;
  stopOrder?: number;
  stopMilestone?: "ARRIVAL" | "DEPARTURE" | "COMPLETE";
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

const EMPTY_PICKUP_STATE_ORDER = [
  "ASIGNADO",
  "EN_RUTA_ORIGEN",
  "LLEGADA_ORIGEN",
  "EN_RUTA_DESTINO",
  "LLEGADA_DESTINO",
  "FINALIZADO",
];

const EMPTY_RETURN_STATE_ORDER = [
  "ASIGNADO",
  "EN_RUTA_ORIGEN",
  "LLEGADA_ORIGEN",
  "EN_RUTA_DESTINO",
  "LLEGADA_DESTINO",
  "FINALIZADO",
];

const INTERNAL_MOVEMENT_STATE_ORDER = [
  "ASIGNADO",
  "EN_RUTA_ORIGEN",
  "LLEGADA_ORIGEN",
  "EN_RUTA_DESTINO",
  "LLEGADA_DESTINO",
  "FINALIZADO",
];

const LOOSE_CARGO_STATE_ORDER = [
  "ASIGNADO",
  "EN_RUTA_ORIGEN",
  "LLEGADA_ORIGEN",
  "EN_RUTA_DESTINO",
  "LLEGADA_DESTINO",
  "FINALIZADO",
];

function normalizeTravelState(state?: string | null): string {
  if (!state || state === "ASIGNADO") return "ASIGNADO";
  if (state === "VERIFICADO_EN_SITIO") return "ASIGNADO";
  if (state === "EN_PUERTO_CARGADO") return "EN_PUERTO";
  return state;
}

function getTravelStartDate(
  operation: OperationData,
  nextState?: string,
): string | null {
  if (!nextState || !TRAVEL_START_STATES.has(nextState)) return null;
  const originAppointment =
    operation.type !== "NACIONAL" ? operation.fechaCitaOrigen : null;
  const destinationAppointment =
    operation.type !== "NACIONAL" ? operation.fechaCitaDestino : null;
  if (operation.isContainerized !== true) {
    if (nextState === "RUMBO_AL_PUERTO" && operation.type === "EXPORTACION") {
      return destinationAppointment ?? operation.scheduledAt ?? null;
    }
    if (nextState === "EN_RUTA_ORIGEN") {
      return originAppointment ?? operation.scheduledAt ?? null;
    }
    if (nextState === "EN_RUTA_DESTINO") {
      return destinationAppointment ?? operation.scheduledAt ?? null;
    }
    return operation.scheduledAt ?? null;
  }
  if (
    operation.isContainerized === true &&
    nextState === "EN_RUTA_ORIGEN" &&
    operation.containerStatus === "PENDIENTE_DEVOLUCION"
  ) {
    return operation.fechaCitaDesvio ?? operation.scheduledAt ?? null;
  }
  if (nextState === "EN_RUTA_DESTINO") {
    return destinationAppointment ?? operation.scheduledAt ?? null;
  }
  if (nextState === "RUMBO_AL_PUERTO") {
    if (operation.type === "EXPORTACION") {
      return destinationAppointment ?? operation.scheduledAt ?? null;
    }
    return originAppointment ?? operation.scheduledAt ?? null;
  }
  if (nextState === "EN_RUTA_ORIGEN") {
    return originAppointment ?? operation.scheduledAt ?? null;
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

function hasStageEvidence(
  operation: OperationData,
  type: string,
  etapa?: string,
): boolean {
  return Boolean(
    operation.evidences?.some(
      (evidence) =>
        evidence.type === type &&
        evidence.estadoRevision !== "DEVUELTO" &&
        (!etapa || evidence.etapa === etapa),
    ),
  );
}

function hasAllEvidence(
  operation: OperationData,
  types?: string[],
  etapa?: string,
): boolean {
  return (types ?? []).every((type) =>
    etapa
      ? hasStageEvidence(operation, type, etapa)
      : hasValidEvidence(operation, type),
  );
}

function hasRequiredEvidence(
  operation: OperationData,
  step: WorkflowStep,
): boolean {
  if (step.id === "empty-pickup-close") {
    return (
      hasValidEvidence(operation, DELIVERY_DOC_EVIDENCE) ||
      hasValidEvidence(operation, PORT_EXIT_EVIDENCE) ||
      hasValidEvidence(operation, CLOSING_EVIDENCE)
    );
  }
  if (step.id === "empty-pickup-port-exit") {
    return (
      hasValidEvidence(operation, PORT_ENTRY_EVIDENCE) &&
      (
        hasValidEvidence(operation, PORT_EXIT_EVIDENCE) ||
        hasValidEvidence(operation, CLOSING_EVIDENCE) ||
        hasValidEvidence(operation, DELIVERY_DOC_EVIDENCE)
      )
    );
  }
  return (step.requiresEvidence ?? []).every((type) => {
    if (
      type === LOADING_PHOTO_EVIDENCE &&
      (operation.type === "EXPORTACION" ||
        operation.type === "EXPORTACION_ANTICIPADA" ||
        operation.isAnticipada)
    ) {
      return (
        hasStageEvidence(
          operation,
          LOADING_PHOTO_EVIDENCE,
          step.requiresEvidenceStages?.[type] ?? step.requiresEvidenceStage,
        ) || hasValidEvidence(operation, SEAL_EVIDENCE)
      );
    }
    return hasStageEvidence(
      operation,
      type,
      step.requiresEvidenceStages?.[type] ?? step.requiresEvidenceStage,
    );
  });
}

function hasActionEvidence(
  operation: OperationData,
  step: WorkflowStep,
): boolean {
  if (step.action !== "evidence") return true;
  if (step.id === "empty-pickup-close") {
    return hasRequiredEvidence(operation, step);
  }
  return hasAllEvidence(
    operation,
    step.evidenceTypes,
    step.evidenceStage,
  );
}

const containerStatusTransitions: Partial<
  Record<OperationContainerStatus, OperationContainerStatus[]>
> = {
  PENDIENTE: ["EN_INSPECCION", "CARGANDO_AL_TRAILER", "EN_CARGUE"],
  PENDIENTE_CARGUE: ["CARGANDO_AL_TRAILER", "EN_CARGUE"],
  VACIO: ["CARGANDO_AL_TRAILER", "EN_CARGUE"],
  EN_INSPECCION: ["CARGANDO_AL_TRAILER", "EN_CARGUE", "FALLA_REPORTADA"],
  EN_CARGUE: ["CARGADO", "FALLA_REPORTADA"],
  CARGADO: ["EN_DESCARGUE", "DESMONTANDO_DEL_TRAILER", "EN_PISO"],
  EN_DESCARGUE: ["DESCARGADO", "EN_PISO"],
  DESCARGADO: ["DESMONTANDO_DEL_TRAILER", "EN_PISO"],
  EN_PISO: ["EN_INSPECCION", "FALLA_REPORTADA"],
  CARGANDO_AL_TRAILER: ["CARGADO_AL_TRAILER"],
  CARGADO_AL_TRAILER: [
    "EN_CARGUE",
    "EN_DESCARGUE",
    "DESMONTANDO_DEL_TRAILER",
  ],
  DESMONTANDO_DEL_TRAILER: ["DESMONTADO_DEL_TRAILER"],
};

const containerWorkflowOrder: OperationContainerStatus[] = [
  "PENDIENTE",
  "VACIO",
  "CARGANDO_AL_TRAILER",
  "CARGADO_AL_TRAILER",
  "EN_CARGUE",
  "CARGADO",
  "EN_DESCARGUE",
  "DESCARGADO",
  "DESMONTANDO_DEL_TRAILER",
  "DESMONTADO_DEL_TRAILER",
];

function hasReachedContainerStatus(
  current: OperationContainerStatus | undefined,
  target: OperationContainerStatus,
): boolean {
  const currentIndex = containerWorkflowOrder.indexOf(current ?? "PENDIENTE");
  const targetIndex = containerWorkflowOrder.indexOf(target);
  return current === target || (currentIndex >= 0 && currentIndex > targetIndex);
}

const getMilestoneContainerStatuses = (
  operation: OperationData,
  state: string,
): OperationContainerStatus[] => {
  if (operation.isContainerized !== true) return [];
  if ((operation.type === "EXPORTACION" || operation.isAnticipada) && state === "EN_CLIENTE") {
    return ["EN_CARGUE", "CARGADO"];
  }
  if (
    (operation.type === "EXPORTACION" ||
      operation.type === "EXPORTACION_ANTICIPADA" ||
      operation.isAnticipada) &&
    state === "EN_PUERTO"
  ) {
    return ["DESMONTANDO_DEL_TRAILER", "DESMONTADO_DEL_TRAILER"];
  }
  if (operation.type === "MOVIMIENTO_INTERNO" && state === "LLEGADA_ORIGEN") {
    return ["EN_CARGUE", "CARGADO"];
  }
  if (operation.type === "MOVIMIENTO_INTERNO" && state === "LLEGADA_DESTINO") {
    return ["EN_DESCARGUE", "DESCARGADO"];
  }
  if (operation.type === "IMPORTACION" && state === "EN_CLIENTE") {
    return ["EN_DESCARGUE", "DESCARGADO", "EN_PISO"];
  }
  if (operation.type === "RETIRO_VACIO" && state === "EN_CLIENTE") {
    return ["EN_PISO"];
  }
  if (operation.type === "RETIRO_VACIO" && state === "LLEGADA_ORIGEN") {
    return ["EN_CARGUE", "CARGADO"];
  }
  if (operation.type === "RETIRO_VACIO" && state === "LLEGADA_DESTINO") {
    return ["EN_DESCARGUE", "DESCARGADO", "EN_PISO"];
  }
  if (
    operation.type === "DEVOLUCION_VACIO" &&
    state === "LLEGADA_ORIGEN"
  ) {
    return ["EN_CARGUE", "CARGADO"];
  }
  if (
    operation.type === "DEVOLUCION_VACIO" &&
    state === "LLEGADA_DESTINO"
  ) {
    return ["EN_DESCARGUE", "DESCARGADO"];
  }
  return [];
};

export function getRequiredContainerAction(
  operation: OperationData,
  requiredStatuses?: OperationContainerStatus[],
): OperationContainerStatus | null {
  if (operation.isContainerized !== true) return null;
  const state = normalizeTravelState(operation.estadoViaje);
  const currentStatus = operation.containerStatus || "PENDIENTE";
  const required = requiredStatuses?.length
    ? requiredStatuses
    : getMilestoneContainerStatuses(operation, state);

  if (required.includes(currentStatus)) return null;

  const nextStatuses = containerStatusTransitions[currentStatus] ?? [];
  const directTarget = required.find((status) =>
    nextStatuses.includes(status),
  );
  if (directTarget) return directTarget;

  const intermediateStatuses: Partial<
    Record<OperationContainerStatus, Partial<Record<OperationContainerStatus, OperationContainerStatus>>>
  > = {
    PENDIENTE: {
      CARGADO: "EN_CARGUE",
      DESCARGADO: "EN_CARGUE",
      EN_PISO: "EN_CARGUE",
    },
    EN_CARGUE: {
      DESCARGADO: "CARGADO",
      EN_PISO: "CARGADO",
    },
    CARGADO: {
      DESCARGADO: "EN_DESCARGUE",
    },
  };
  for (const target of required) {
    const intermediate = intermediateStatuses[currentStatus]?.[target];
    if (intermediate && nextStatuses.includes(intermediate)) {
      return intermediate;
    }
  }
  return null;
}

function isContainerReady(
  operation: OperationData,
  required?: OperationContainerStatus[],
): boolean {
  return (
    !required?.length ||
    required.some(
      (status) =>
        operation.containerStatus === status ||
        hasReachedContainerStatus(operation.containerStatus, status),
    )
  );
}

function hasReachedTravelState(
  currentState: string,
  targetState: string,
  stateOrder: string[],
): boolean {
  const currentIndex = stateOrder.indexOf(currentState);
  const targetIndex = stateOrder.indexOf(targetState);
  return currentIndex >= 0 && targetIndex >= 0 && currentIndex >= targetIndex;
}

function hasStepStopMilestone(
  step: WorkflowStep,
  operation: OperationData,
  currentState: string,
  stateOrder: string[],
): boolean {
  if (step.stopOrder === undefined || !step.stopMilestone) return true;
  const stop = operation.stops?.find(
    (candidate) => candidate.stopOrder === step.stopOrder,
  );
  const milestoneState = step.nextState ?? step.beforeState;
  if (step.stopMilestone === "ARRIVAL") {
    return Boolean(
      stop?.actualArrivalAt ||
      (milestoneState &&
        hasReachedTravelState(currentState, milestoneState, stateOrder)),
    );
  }
  if (step.stopMilestone === "DEPARTURE") {
    return Boolean(
      stop?.actualDepartureAt ||
      (!stop &&
        milestoneState &&
        hasReachedTravelState(currentState, milestoneState, stateOrder)),
    );
  }
  return Boolean(
    stop?.completedAt ||
    (!stop &&
      milestoneState &&
      hasReachedTravelState(currentState, milestoneState, stateOrder)),
  );
}

function isStepComplete(
  step: WorkflowStep,
  operation: OperationData,
  currentState: string,
  stateOrder: string[],
): boolean {
  if (step.action === "container-status" && step.containerStatus) {
    return hasReachedContainerStatus(operation.containerStatus, step.containerStatus);
  }
  if (step.action === "verify-plates") {
    if (operation.status !== "ASIGNADO") return true;
    return Boolean(
      hasValidEvidence(operation, CAB_PLATE_EVIDENCE) &&
      hasValidEvidence(operation, TRAILER_PLATE_EVIDENCE),
    );
  }
  if (step.action === "ocr") {
    const containerStatusReady =
      (step.id !== "impo-ocr" && step.id !== "amparo-impo-ocr") ||
      hasReachedContainerStatus(
        operation.containerStatus,
        "CARGADO_AL_TRAILER",
      );
    const evidenceTypes = new Set([
      ...CONTAINER_OCR_EVIDENCE_TYPES,
      ...(step.evidenceTypes ?? []),
    ]);
    return (
      containerStatusReady &&
      isContainerReady(operation, step.requiresContainerStatus) &&
      (!step.containerStatus ||
        hasReachedContainerStatus(operation.containerStatus, step.containerStatus)) &&
      hasRequiredEvidence(operation, step) &&
      hasStepStopMilestone(step, operation, currentState, stateOrder) &&
      [...evidenceTypes].some((type) =>
        hasStageEvidence(operation, type, step.evidenceStage),
      )
    );
  }
  const resultState = step.nextState ?? step.beforeState;
  const stateComplete =
    resultState === undefined ||
    hasReachedTravelState(currentState, resultState, stateOrder);
  const statusComplete =
    !step.containerStatus ||
    hasReachedContainerStatus(operation.containerStatus, step.containerStatus);
  const cargoStatusComplete =
    !step.requiresCargoStatus?.length ||
    step.requiresCargoStatus.includes(operation.cargoStatus || "PENDIENTE");
  const importClientTravelAlreadyStarted =
    (step.id === "impo-to-client" || step.id === "amparo-impo-to-client") &&
    hasReachedTravelState(currentState, "RUMBO_AL_CLIENTE", stateOrder);
  return (
    stateComplete &&
    statusComplete &&
    cargoStatusComplete &&
    (!step.requiresSeal || Boolean(operation.sealNumber?.trim())) &&
    isContainerReady(operation, step.requiresContainerStatus) &&
    hasRequiredEvidence(operation, step) &&
    hasActionEvidence(operation, step) &&
    (hasStepStopMilestone(step, operation, currentState, stateOrder) ||
      importClientTravelAlreadyStarted)
  );
}

const STANDARD_WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: "std-start",
    travelState: "ASIGNADO",
    label: "INICIAR VIAJE AL PUERTO",
    nextState: "RUMBO_AL_PUERTO",
    action: "update",
  },
  {
    id: "std-arrive",
    travelState: "RUMBO_AL_PUERTO",
    label: "REPORTAR LLEGADA A PUERTO",
    nextState: "EN_PUERTO",
    action: "update",
  },
  {
    id: "std-ocr",
    travelState: "EN_PUERTO",
    label: "ESCANEAR CARGUE (OCR)",
    action: "ocr",
  },
  {
    id: "std-client",
    travelState: "EN_PUERTO",
    label: "INICIAR RUTA A CLIENTE",
    nextState: "RUMBO_AL_CLIENTE",
    action: "update",
  },
  {
    id: "std-arrive-client",
    travelState: "RUMBO_AL_CLIENTE",
    label: "LLEGADA A CLIENTE",
    nextState: "EN_CLIENTE",
    action: "update",
  },
  {
    id: "std-close",
    travelState: "EN_CLIENTE",
    label: "SOPORTE Y FINALIZAR",
    nextState: "FINALIZADO",
    action: "close",
  },
];

const EMPTY_PICKUP_STEPS: WorkflowStep[] = [
  {
    id: "empty-pickup-depart-yard",
    travelState: "ASIGNADO",
    label: "INICIAR RUTA AL PATIO DE VACÍOS",
    nextState: "EN_RUTA_ORIGEN",
    action: "update",
  },
  {
    id: "empty-pickup-arrive-yard",
    travelState: "EN_RUTA_ORIGEN",
    label: "REPORTAR LLEGADA AL PATIO DE VACÍOS",
    nextState: "LLEGADA_ORIGEN",
    action: "update",
  },
  {
    id: "empty-pickup-ocr",
    travelState: "LLEGADA_ORIGEN",
    label: "ESCANEAR CONTENEDOR VACÍO (OCR)",
    action: "ocr",
  },
  {
    id: "empty-pickup-comodato",
    travelState: "LLEGADA_ORIGEN",
    label: "SUBIR COMODATO DE RETIRO",
    action: "evidence",
    evidenceTypes: [COMODATO_EVIDENCE],
    requiresEvidence: [CONTAINER_NUMBER_EVIDENCE],
  },
  {
    id: "empty-pickup-depart-client",
    travelState: "LLEGADA_ORIGEN",
    label: "INICIAR RUTA AL DESTINO",
    nextState: "EN_RUTA_DESTINO",
    action: "update",
    requiresEvidence: [CONTAINER_NUMBER_EVIDENCE, COMODATO_EVIDENCE],
    requiresContainerStatus: ["CARGADO"],
  },
  {
    id: "empty-pickup-arrive-destination",
    travelState: "EN_RUTA_DESTINO",
    label: "REPORTAR LLEGADA AL DESTINO",
    nextState: "LLEGADA_DESTINO",
    action: "update",
  },
  {
    id: "empty-pickup-close",
    travelState: "LLEGADA_DESTINO",
    label: "SUBIR SOPORTE DE ENTREGA Y FINALIZAR",
    nextState: "FINALIZADO",
    action: "evidence",
    evidenceTypes: [DELIVERY_DOC_EVIDENCE],
    requiresContainerStatus: ["DESCARGADO", "EN_PISO"],
  },
];

const EMPTY_PICKUP_TO_PORT_STEPS: WorkflowStep[] = [
  ...EMPTY_PICKUP_STEPS.slice(0, 6),
  {
    id: "empty-pickup-port-entry",
    travelState: "LLEGADA_DESTINO",
    label: "SUBIR ARIN DE INGRESO AL PUERTO",
    action: "evidence",
    evidenceTypes: [PORT_ENTRY_EVIDENCE],
    requiresContainerStatus: ["EN_DESCARGUE", "DESCARGADO"],
  },
  {
    id: "empty-pickup-port-exit",
    travelState: "LLEGADA_DESTINO",
    label: "SUBIR ARIN DE SALIDA Y FINALIZAR",
    nextState: "FINALIZADO",
    action: "evidence",
    evidenceTypes: [PORT_EXIT_EVIDENCE],
    requiresEvidence: [PORT_ENTRY_EVIDENCE],
    requiresContainerStatus: ["DESCARGADO"],
  },
];

const EMPTY_RETURN_STEPS: WorkflowStep[] = [
  {
    id: "empty-return-depart-origin",
    travelState: "ASIGNADO",
    label: "INICIAR VIAJE A LA BODEGA O PATIO",
    nextState: "EN_RUTA_ORIGEN",
    action: "update",
  },
  {
    id: "empty-return-arrive-origin",
    travelState: "EN_RUTA_ORIGEN",
    label: "REPORTAR LLEGADA AL ORIGEN",
    nextState: "LLEGADA_ORIGEN",
    action: "update",
  },
  {
    id: "empty-return-ocr",
    travelState: "LLEGADA_ORIGEN",
    label: "FOTO OCR DEL CONTENEDOR VACÍO",
    action: "ocr",
    requiresContainerStatus: ["CARGADO"],
    instruction: "Confirma el contenedor vacío antes de salir del origen.",
  },
  {
    id: "empty-return-depart-destination",
    travelState: "LLEGADA_ORIGEN",
    label: "INICIAR TRASLADO AL DEPÓSITO O PUERTO",
    nextState: "EN_RUTA_DESTINO",
    action: "update",
    requiresContainerStatus: ["CARGADO"],
    requiresEvidence: [CONTAINER_NUMBER_EVIDENCE],
  },
  {
    id: "empty-return-arrive-destination",
    travelState: "EN_RUTA_DESTINO",
    label: "REPORTAR LLEGADA AL DEPÓSITO O PUERTO",
    nextState: "LLEGADA_DESTINO",
    action: "update",
  },
  {
    id: "empty-return-comodato",
    travelState: "LLEGADA_DESTINO",
    label: "SUBIR COMODATO DE DEVOLUCIÓN",
    action: "evidence",
    evidenceTypes: [COMODATO_EVIDENCE],
    requiresContainerStatus: ["DESCARGADO"],
  },
  {
    id: "empty-return-close",
    travelState: "LLEGADA_DESTINO",
    label: "CERRAR DEVOLUCIÓN DE VACÍO",
    nextState: "FINALIZADO",
    action: "close",
    requiresContainerStatus: ["DESCARGADO"],
    requiresEvidence: [COMODATO_EVIDENCE],
  },
];

const EMPTY_RETURN_FROM_PORT_STEPS: WorkflowStep[] = [
  ...EMPTY_RETURN_STEPS.slice(0, 2),
  {
    id: "empty-return-port-entry",
    travelState: "LLEGADA_ORIGEN",
    label: "SUBIR ARIN DE INGRESO AL PUERTO",
    action: "evidence",
    evidenceTypes: [PORT_ENTRY_EVIDENCE],
  },
  {
    id: "empty-return-port-exit",
    travelState: "LLEGADA_ORIGEN",
    label: "SUBIR ARIN DE SALIDA DEL PUERTO",
    action: "evidence",
    evidenceTypes: [PORT_EXIT_EVIDENCE],
    requiresEvidence: [PORT_ENTRY_EVIDENCE],
    requiresContainerStatus: ["CARGADO"],
  },
  {
    ...EMPTY_RETURN_STEPS[3],
    requiresEvidence: [PORT_ENTRY_EVIDENCE, PORT_EXIT_EVIDENCE],
    requiresContainerStatus: ["DESCARGADO"],
  },
  {
    id: "empty-return-ocr-outside-port",
    travelState: "EN_RUTA_DESTINO",
    label: "FUERA DEL PUERTO: FOTO OCR DEL CONTENEDOR VACÍO",
    action: "ocr",
    evidenceStage: "EN_RUTA_DESTINO",
    requiresEvidence: [PORT_EXIT_EVIDENCE],
    requiresContainerStatus: ["CARGADO"],
  },
  ...EMPTY_RETURN_STEPS.slice(4),
];

const INTERNAL_MOVEMENT_STEPS: WorkflowStep[] = [
  {
    id: "internal-movement-depart-origin",
    travelState: "ASIGNADO",
    label: "INICIAR RUTA AL ORIGEN",
    nextState: "EN_RUTA_ORIGEN",
    action: "update",
  },
  {
    id: "internal-movement-arrive-origin",
    travelState: "EN_RUTA_ORIGEN",
    label: "REPORTAR LLEGADA AL ORIGEN",
    nextState: "LLEGADA_ORIGEN",
    action: "update",
    stopOrder: 0,
    stopMilestone: "ARRIVAL",
    instruction: "Realiza el cargue o enganche en el origen antes de continuar.",
  },
  {
    id: "internal-movement-loading-start",
    travelState: "LLEGADA_ORIGEN",
    label: "CARGANDO CONTENEDOR AL TRÁILER",
    action: "container-status",
    containerStatus: "CARGANDO_AL_TRAILER",
  },
  {
    id: "internal-movement-loading-finish",
    travelState: "LLEGADA_ORIGEN",
    label: "CONTENEDOR CARGADO AL TRÁILER + FOTO OCR",
    action: "ocr",
    containerStatus: "CARGADO_AL_TRAILER",
  },
  {
    id: "internal-movement-depart-destination",
    travelState: "LLEGADA_ORIGEN",
    label: "INICIAR RUTA AL DESTINO",
    nextState: "EN_RUTA_DESTINO",
    action: "update",
    requiresEvidence: [CONTAINER_NUMBER_EVIDENCE],
    stopOrder: 0,
    stopMilestone: "DEPARTURE",
  },
  {
    id: "internal-movement-arrive-destination",
    travelState: "EN_RUTA_DESTINO",
    label: "REPORTAR LLEGADA AL DESTINO",
    nextState: "LLEGADA_DESTINO",
    action: "update",
    stopOrder: 1,
    stopMilestone: "ARRIVAL",
  },
  {
    id: "internal-movement-unmounting-start",
    travelState: "LLEGADA_DESTINO",
    label: "DESMONTANDO CONTENEDOR DEL TRÁILER",
    action: "container-status",
    containerStatus: "DESMONTANDO_DEL_TRAILER",
  },
  {
    id: "internal-movement-unloading",
    travelState: "LLEGADA_DESTINO",
    label: "CONTENEDOR DESMONTADO + COMODATO / EIR / ENTREGA",
    nextState: "FINALIZADO",
    action: "evidence",
    containerStatus: "DESMONTADO_DEL_TRAILER",
    evidenceTypes: [COMODATO_EVIDENCE, CLOSING_EVIDENCE],
    stopOrder: 1,
    stopMilestone: "COMPLETE",
  },
];

const INTERNAL_MOVEMENT_LOOSE_CARGO_STEPS: WorkflowStep[] = [
  INTERNAL_MOVEMENT_STEPS[0],
  INTERNAL_MOVEMENT_STEPS[1],
  {
    id: "internal-movement-loose-loading",
    travelState: "LLEGADA_ORIGEN",
    label: "SUBIR EVIDENCIA DE CARGA Y SALIR AL DESTINO",
    nextState: "EN_RUTA_DESTINO",
    action: "evidence",
    evidenceTypes: [LOOSE_CARGO_EVIDENCE],
    requiresCargoStatus: ["CARGADO"],
    instruction:
      "Envía cuatro fotos de la carga: de frente, de atrás y de ambos lados.",
  },
  INTERNAL_MOVEMENT_STEPS[4],
  {
    id: "internal-movement-loose-arrival",
    travelState: "LLEGADA_DESTINO",
    label: "SUBIR FOTOS DE LA CARGA AL LLEGAR",
    action: "evidence",
    evidenceTypes: [LOOSE_CARGO_ARRIVAL_EVIDENCE],
  },
  {
    id: "internal-movement-loose-unloading",
    travelState: "LLEGADA_DESTINO",
    label: "SUBIR FOTOS DEL DESCARGUE",
    action: "evidence",
    evidenceTypes: [LOOSE_CARGO_UNLOADING_EVIDENCE],
    requiresCargoStatus: ["EN_DESCARGUE"],
    requiresEvidence: [LOOSE_CARGO_ARRIVAL_EVIDENCE],
  },
  {
    id: "internal-movement-loose-close",
    travelState: "LLEGADA_DESTINO",
    label: "SUBIR SOPORTE Y CERRAR MOVIMIENTO",
    nextState: "FINALIZADO",
    action: "evidence",
    evidenceTypes: [DELIVERY_DOC_EVIDENCE],
    requiresEvidence: [
      LOOSE_CARGO_ARRIVAL_EVIDENCE,
      LOOSE_CARGO_UNLOADING_EVIDENCE,
    ],
    requiresCargoStatus: ["DESCARGADO"],
  },
];

const LOOSE_CARGO_STEPS: WorkflowStep[] = [
  {
    id: "loose-cargo-depart-origin",
    travelState: "ASIGNADO",
    label: "INICIAR RUTA AL ORIGEN",
    nextState: "EN_RUTA_ORIGEN",
    action: "update",
  },
  {
    id: "loose-cargo-arrive-origin",
    travelState: "EN_RUTA_ORIGEN",
    label: "REPORTAR LLEGADA AL ORIGEN",
    nextState: "LLEGADA_ORIGEN",
    action: "update",
    stopOrder: 0,
    stopMilestone: "ARRIVAL",
  },
  {
    id: "loose-cargo-evidence",
    travelState: "LLEGADA_ORIGEN",
    label: "SUBIR EVIDENCIA CARGA SUELTA",
    nextState: "EN_RUTA_DESTINO",
    action: "evidence",
    evidenceTypes: [LOOSE_CARGO_EVIDENCE],
    requiresCargoStatus: ["CARGADO"],
    stopOrder: 0,
    stopMilestone: "DEPARTURE",
    instruction:
      "Envía cuatro fotos de la carga: de frente, de atrás y de ambos lados.",
  },
  {
    id: "loose-cargo-arrive-destination",
    travelState: "EN_RUTA_DESTINO",
    label: "REPORTAR LLEGADA AL DESTINO",
    nextState: "LLEGADA_DESTINO",
    action: "update",
    stopOrder: 1,
    stopMilestone: "ARRIVAL",
  },
  {
    id: "loose-cargo-arrival-photos",
    travelState: "LLEGADA_DESTINO",
    label: "SUBIR FOTOS DE LA CARGA AL LLEGAR",
    action: "evidence",
    evidenceTypes: [LOOSE_CARGO_ARRIVAL_EVIDENCE],
    instruction:
      "Al llegar al cliente, envía al menos dos fotos para dejar constancia del estado en que llegó la carga.",
  },
  {
    id: "loose-cargo-unloading-photos",
    travelState: "LLEGADA_DESTINO",
    label: "SUBIR FOTOS DEL DESCARGUE",
    action: "evidence",
    evidenceTypes: [LOOSE_CARGO_UNLOADING_EVIDENCE],
    requiresCargoStatus: ["EN_DESCARGUE"],
    requiresEvidence: [LOOSE_CARGO_ARRIVAL_EVIDENCE],
    instruction:
      "Inicia el descargue y envía al menos dos fotos del producto mientras lo descargan.",
  },
  {
    id: "loose-cargo-close",
    travelState: "LLEGADA_DESTINO",
    label: "SUBIR SOPORTE DE ENTREGA / DESCARGUE",
    nextState: "FINALIZADO",
    action: "evidence",
    evidenceTypes: [DELIVERY_DOC_EVIDENCE],
    requiresEvidence: [
      LOOSE_CARGO_ARRIVAL_EVIDENCE,
      LOOSE_CARGO_UNLOADING_EVIDENCE,
    ],
    requiresCargoStatus: ["DESCARGADO"],
    instruction:
      "Cuando el descargue esté finalizado, sube el soporte de entrega para cerrar el viaje.",
  },
];

const PLATE_VERIFICATION_STEP: WorkflowStep = {
  id: "verify-fleet-plates",
  travelState: "ASIGNADO",
  label: "VERIFICAR / OCR PLACAS DEL CABEZOTE Y TRÁILER",
  action: "verify-plates",
  instruction:
    "Antes de iniciar el viaje, confirma con fotos que el cabezote y el tráiler correspondan a esta operación.",
};

const IMPORT_TO_YARD_STEPS: WorkflowStep[] = [
  {
    id: "impo-start",
    travelState: "ASIGNADO",
    label: "INICIAR RUTA AL PUERTO",
    nextState: "RUMBO_AL_PUERTO",
    action: "update",
  },
  {
    id: "impo-arrive-port",
    travelState: "RUMBO_AL_PUERTO",
    label: "REPORTAR LLEGADA A PUERTO + SUBIR ARIN DE INGRESO",
    action: "evidence",
    evidenceTypes: [PORT_ENTRY_EVIDENCE],
    beforeState: "EN_PUERTO",
    stopOrder: 0,
    stopMilestone: "ARRIVAL",
  },
  {
    id: "impo-loading-trailer",
    travelState: "EN_PUERTO",
    label: "CARGANDO CONTENEDOR AL TRÁILER",
    action: "container-status",
    containerStatus: "CARGANDO_AL_TRAILER",
  },
  {
    id: "impo-loaded-trailer",
    travelState: "EN_PUERTO",
    label: "CONTENEDOR CARGADO EN TRÁILER",
    action: "container-status",
    containerStatus: "CARGADO_AL_TRAILER",
  },
  {
    id: "impo-leave-port",
    travelState: "EN_PUERTO",
    label: "SALIDA DE PUERTO + SUBIR ARIN DE SALIDA",
    action: "evidence",
    evidenceTypes: [PORT_EXIT_EVIDENCE],
    requiresEvidence: [PORT_ENTRY_EVIDENCE],
    stopOrder: 0,
    stopMilestone: "DEPARTURE",
  },
  {
    id: "impo-ocr",
    travelState: "EN_PUERTO",
    label: "CAPTURA FUERA DE TERMINAL: FOTO OCR DEL CONTENEDOR",
    action: "ocr",
    evidenceStage: "EN_PUERTO_CARGADO",
    requiresEvidence: [PORT_EXIT_EVIDENCE],
    instruction:
      "Fuera de la terminal, toma la foto OCR del contenedor cargado en el vehículo.",
  },
  {
    id: "impo-to-client",
    travelState: "EN_PUERTO",
    label: "INICIAR VIAJE AL CLIENTE",
    nextState: "RUMBO_AL_CLIENTE",
    action: "update",
    stopOrder: 0,
    stopMilestone: "DEPARTURE",
  },
  {
    id: "impo-arrive-client",
    travelState: "RUMBO_AL_CLIENTE",
    label: "REPORTAR LLEGADA AL CLIENTE",
    nextState: "EN_CLIENTE",
    action: "update",
    stopOrder: 1,
    stopMilestone: "ARRIVAL",
  },
  {
    id: "impo-unloading",
    travelState: "EN_CLIENTE",
    label: "INICIANDO DESCARGUE DE MERCANCÍA",
    action: "container-status",
    containerStatus: "EN_DESCARGUE",
  },
  {
    id: "impo-unloading-evidence",
    travelState: "EN_CLIENTE",
    label: "SUBIR EVIDENCIA DE DESCARGUE",
    action: "evidence",
    evidenceTypes: ["EVIDENCIA_DESCARGUE_CONTENEDOR"],
    requiresContainerStatus: ["EN_DESCARGUE"],
  },
  {
    id: "impo-unloaded",
    travelState: "EN_CLIENTE",
    label: "MERCANCÍA DESCARGADA",
    action: "container-status",
    containerStatus: "DESCARGADO",
    requiresEvidence: ["EVIDENCIA_DESCARGUE_CONTENEDOR"],
  },
  {
    id: "impo-to-yard",
    travelState: "EN_CLIENTE",
    label: "INICIAR VIAJE AL PATIO",
    nextState: "EN_RUTA_DESTINO",
    action: "update",
    stopOrder: 1,
    stopMilestone: "DEPARTURE",
  },
  {
    id: "impo-arrive-yard",
    travelState: "EN_RUTA_DESTINO",
    label: "REPORTAR LLEGADA AL PATIO",
    nextState: "LLEGADA_DESTINO",
    action: "update",
    stopOrder: 2,
    stopMilestone: "ARRIVAL",
  },
  {
    id: "impo-unmounting",
    travelState: "LLEGADA_DESTINO",
    label: "DESMONTANDO CONTENEDOR DEL TRÁILER",
    action: "container-status",
    containerStatus: "DESMONTANDO_DEL_TRAILER",
  },
  {
    id: "impo-close",
    travelState: "LLEGADA_DESTINO",
    label: "CONTENEDOR DESMONTADO + COMODATO / EIR Y FINALIZAR",
    containerStatus: "DESMONTADO_DEL_TRAILER",
    nextState: "FINALIZADO",
    action: "evidence",
    evidenceTypes: [COMODATO_EVIDENCE, TIRILLA_EIR_EVIDENCE],
    stopOrder: 2,
    stopMilestone: "COMPLETE",
    instruction:
      "Adjunta la Tirilla EIR emitida por el depósito o puerto. El comodato es un documento distinto y no reemplaza este soporte.",
  },
];

const IMPORT_FLOOR_CLOSE_STEP: WorkflowStep = {
  id: "impo-floor-close",
  travelState: "EN_CLIENTE",
  label: "SUBIR SOPORTE Y CERRAR TRAMO EN CLIENTE",
  nextState: "FINALIZADO",
  action: "close",
  requiresContainerStatus: ["EN_PISO"],
  stopOrder: 1,
  stopMilestone: "COMPLETE",
  instruction:
    "El contenedor quedó en piso. Adjunta el soporte del cierre físico; su devolución se programa en una operación hija.",
};

const IMPORT_TO_FLOOR_STEPS: WorkflowStep[] = [
  ...IMPORT_TO_YARD_STEPS.filter(
    (step) =>
      ![
        "impo-to-yard",
        "impo-arrive-yard",
        "impo-unmounting",
        "impo-close",
      ].includes(step.id),
  ),
  IMPORT_FLOOR_CLOSE_STEP,
];

const EXPORT_STEPS: WorkflowStep[] = [
  {
    id: "expo-start",
    travelState: "ASIGNADO",
    label: "INICIAR VIAJE AL PATIO DE VACÍOS",
    nextState: "EN_RUTA_ORIGEN",
    action: "update",
  },
  {
    id: "expo-arrive-yard",
    travelState: "EN_RUTA_ORIGEN",
    label: "LLEGADA A PATIO + SUBIR COMODATO / RETIRO",
    action: "evidence",
    evidenceTypes: [COMODATO_EVIDENCE],
    beforeState: "LLEGADA_ORIGEN",
    stopOrder: 0,
    stopMilestone: "ARRIVAL",
  },
  {
    id: "expo-loading-trailer",
    travelState: "LLEGADA_ORIGEN",
    label: "CARGANDO CONTENEDOR VACÍO AL TRÁILER",
    action: "container-status",
    containerStatus: "CARGANDO_AL_TRAILER",
  },
  {
    id: "expo-ocr",
    travelState: "LLEGADA_ORIGEN",
    label: "CONTENEDOR CARGADO EN TRÁILER + FOTO OCR DEL CONTENEDOR",
    action: "ocr",
    containerStatus: "CARGADO_AL_TRAILER",
  },
  {
    id: "expo-to-client",
    travelState: "LLEGADA_ORIGEN",
    label: "INICIAR RUTA A CLIENTE",
    nextState: "RUMBO_AL_CLIENTE",
    action: "update",
    requiresEvidence: [CONTAINER_NUMBER_EVIDENCE, COMODATO_EVIDENCE],
    stopOrder: 0,
    stopMilestone: "DEPARTURE",
  },
  {
    id: "expo-arrive-client",
    travelState: "RUMBO_AL_CLIENTE",
    label: "REPORTAR LLEGADA A CLIENTE",
    nextState: "EN_CLIENTE",
    action: "update",
    stopOrder: 1,
    stopMilestone: "ARRIVAL",
  },
  {
    id: "expo-cargo-loading",
    travelState: "EN_CLIENTE",
    label: "INICIANDO CARGUE DE MERCANCÍA",
    action: "container-status",
    containerStatus: "EN_CARGUE",
  },
  {
    id: "expo-seal-and-closed-container-photo",
    travelState: "EN_CLIENTE",
    label: "REGISTRAR SELLO Y FOTO DEL CONTENEDOR CERRADO (EN CLIENTE)",
    action: "evidence",
    containerStatus: "CARGADO",
    evidenceTypes: [LOADING_PHOTO_EVIDENCE],
    evidenceStage: "EN_CLIENTE",
    requiresSeal: true,
  },
  {
    id: "expo-to-port",
    travelState: "EN_CLIENTE",
    label: "INICIAR VIAJE AL PUERTO",
    nextState: "RUMBO_AL_PUERTO",
    action: "update",
    stopOrder: 1,
    stopMilestone: "DEPARTURE",
    requiresEvidence: [LOADING_PHOTO_EVIDENCE],
    requiresEvidenceStage: "EN_CLIENTE",
    requiresContainerStatus: ["CARGADO"],
    requiresSeal: true,
    instruction:
      "Antes de salir al puerto, confirma que el contenedor esté CARGADO, que el número de sello esté registrado y que la foto del contenedor cerrado se haya subido en cliente.",
  },
  {
    id: "expo-arrive-port",
    travelState: "RUMBO_AL_PUERTO",
    label: "REPORTAR LLEGADA AL PUERTO + SUBIR ARIN DE INGRESO",
    action: "evidence",
    evidenceTypes: [PORT_ENTRY_EVIDENCE],
    beforeState: "EN_PUERTO",
    stopOrder: 2,
    stopMilestone: "ARRIVAL",
  },
  {
    id: "expo-unmounting",
    travelState: "EN_PUERTO",
    label: "DESMONTANDO CONTENEDOR DEL TRÁILER",
    action: "container-status",
    containerStatus: "DESMONTANDO_DEL_TRAILER",
  },
  {
    id: "expo-close",
    travelState: "EN_PUERTO",
    label: "CONTENEDOR DESMONTADO + SUBIR ARIN DE SALIDA Y FINALIZAR",
    containerStatus: "DESMONTADO_DEL_TRAILER",
    nextState: "FINALIZADO",
    action: "evidence",
    evidenceTypes: [PORT_EXIT_EVIDENCE],
    requiresEvidence: [PORT_ENTRY_EVIDENCE],
    stopOrder: 2,
    stopMilestone: "COMPLETE",
    instruction: "Confirma el desmontaje y adjunta el ARIN de salida del puerto.",
  },
];

const AMPARADO_EXPORT_STEPS: WorkflowStep[] = [
  ...EXPORT_STEPS.filter((step) => step.id !== "expo-close").map((step) => ({
    ...step,
    id: `amparo-${step.id}`,
  })),
  {
    id: "amparo-expo-close",
    travelState: "EN_PUERTO",
    label: "CONTENEDOR DESMONTADO + FINALIZAR EXPORTACIÓN AMPARADA",
    nextState: "FINALIZADO",
    containerStatus: "DESMONTADO_DEL_TRAILER",
    action: "container-status",
    stopOrder: 2,
    stopMilestone: "COMPLETE",
    instruction:
      "Confirma que el contenedor quedó desmontado del tráiler para habilitar la importación amparada.",
  },
];

const AMPARADO_IMPORT_STEPS: WorkflowStep[] = [
  {
    id: "amparo-impo-port-entry",
    travelState: "EN_PUERTO",
    label: "SUBIR ARIN DE INGRESO A PUERTO",
    action: "evidence",
    evidenceTypes: [PORT_ENTRY_EVIDENCE],
    beforeState: "EN_PUERTO",
    stopOrder: 0,
    stopMilestone: "ARRIVAL",
  },
  ...IMPORT_TO_YARD_STEPS.filter(
    (step) => !["impo-start", "impo-arrive-port"].includes(step.id),
  ).map((step) => ({ ...step, id: `amparo-${step.id}` })),
];

const getLooseCargoTradeSteps = (operation: OperationData): WorkflowStep[] => {
  const isImport = operation.type === "IMPORTACION";
  const isExport =
    operation.type === "EXPORTACION" ||
    operation.type === "EXPORTACION_ANTICIPADA";
  if (!isImport && !isExport) return LOOSE_CARGO_STEPS;

  const operationLabel =
    operation.isAnticipada ||
    operation.type === "EXPORTACION_ANTICIPADA"
    ? `EXPO ANTICIPADA #${operation.id}`
    : `${isImport ? "IMPO" : "EXPO"} #${operation.id}`;
  const suffix = operation.isAmparado ? ` · ${operationLabel}` : "";
  const state = isImport ? "LLEGADA_ORIGEN" : "LLEGADA_DESTINO";
  const arinSteps: WorkflowStep[] = [
    {
      id: "loose-port-entry",
      travelState: state,
      label: `SUBIR ARIN DE INGRESO${suffix}`,
      action: "evidence",
      evidenceTypes: [PORT_ENTRY_EVIDENCE],
    },
    {
      id: "loose-port-exit",
      travelState: state,
      label: `SUBIR ARIN DE SALIDA${suffix}`,
      action: "evidence",
      evidenceTypes: [PORT_EXIT_EVIDENCE],
      requiresEvidence: [PORT_ENTRY_EVIDENCE],
    },
  ];

  if (isImport) {
    const arrivalIndex = LOOSE_CARGO_STEPS.findIndex(
      (step) => step.id === "loose-cargo-arrive-origin",
    );
    return [
      ...LOOSE_CARGO_STEPS.slice(0, arrivalIndex + 1),
      ...arinSteps,
      ...LOOSE_CARGO_STEPS.slice(arrivalIndex + 1).map((step) =>
        step.id === "loose-cargo-evidence"
          ? {
              ...step,
              requiresEvidence: [PORT_ENTRY_EVIDENCE, PORT_EXIT_EVIDENCE],
            }
          : step,
      ),
    ];
  }

  const arrivalIndex = LOOSE_CARGO_STEPS.findIndex(
    (step) => step.id === "loose-cargo-arrive-destination",
  );
  return [
    ...LOOSE_CARGO_STEPS.slice(0, arrivalIndex + 1),
    ...arinSteps,
    ...LOOSE_CARGO_STEPS.slice(arrivalIndex + 1).map((step) =>
      step.id === "loose-cargo-close"
        ? {
            ...step,
      requiresEvidence: [
        ...(step.requiresEvidence ?? []),
        PORT_ENTRY_EVIDENCE,
        PORT_EXIT_EVIDENCE,
      ],
          }
        : step,
    ),
  ];
};

const AMPARADO_IMPORT_FLOOR_STEPS: WorkflowStep[] = [
  ...AMPARADO_IMPORT_STEPS.filter(
    (step) =>
      ![
        "amparo-impo-to-yard",
        "amparo-impo-arrive-yard",
        "amparo-impo-unmounting",
        "amparo-impo-close",
      ].includes(step.id),
  ),
  { ...IMPORT_FLOOR_CLOSE_STEP, id: "amparo-impo-floor-close" },
];

const PENDING_RETURN_STEPS: WorkflowStep[] = [
  {
    id: "return-start",
    travelState: "LLEGADA_DESTINO",
    label: "INICIAR TRASLADO AL DESTINO CONFIRMADO",
    nextState: "EN_RUTA_ORIGEN",
    action: "update",
  },
  {
    id: "return-arrive",
    travelState: "EN_RUTA_ORIGEN",
    label: "REPORTAR LLEGADA AL DESTINO CONFIRMADO",
    nextState: "LLEGADA_ORIGEN",
    action: "update",
  },
  {
    id: "return-close",
    travelState: "LLEGADA_ORIGEN",
    label: "SUBIR SOPORTE Y FINALIZAR DEVOLUCIÓN",
    nextState: "FINALIZADO",
    action: "close",
  },
];

export function resolveDriverWorkflowSteps(
  operation: OperationData,
): WorkflowStep[] {
  let steps = buildWorkflowSteps(operation, {
    standard: STANDARD_WORKFLOW_STEPS,
    importToYard: IMPORT_TO_YARD_STEPS,
    importToFloor: IMPORT_TO_FLOOR_STEPS,
    amparadoImport: AMPARADO_IMPORT_STEPS,
    amparadoImportFloor: AMPARADO_IMPORT_FLOOR_STEPS,
    pendingReturn: PENDING_RETURN_STEPS,
    export: EXPORT_STEPS,
    amparadoExport: AMPARADO_EXPORT_STEPS,
    emptyPickup: EMPTY_PICKUP_STEPS,
    emptyPickupToPort: EMPTY_PICKUP_TO_PORT_STEPS,
    emptyReturn: EMPTY_RETURN_STEPS,
    emptyReturnFromPort: EMPTY_RETURN_FROM_PORT_STEPS,
    internalMovement:
      operation.isContainerized === true
        ? INTERNAL_MOVEMENT_STEPS
        : INTERNAL_MOVEMENT_LOOSE_CARGO_STEPS,
    looseCargo: getLooseCargoTradeSteps(operation),
  });

  const isImportWorkflow =
    operation.isContainerized === true && operation.type === "IMPORTACION";
  const hasExplicitStops = operation.stops !== undefined;
  const hasReturnYardStop = operation.stops?.some(
    (stop) => stop.stopOrder >= 2,
  );
  if (
    isImportWorkflow &&
    hasExplicitStops &&
    !hasReturnYardStop &&
    getWorkflowFamily(operation) !== "IMPORT_TO_FLOOR" &&
    getWorkflowFamily(operation) !== "AMPARADO_IMPORT_FLOOR"
  ) {
    const prefix = operation.isAmparado ? "amparo-" : "";
    steps = steps
      .filter(
        (step) =>
          step.id !== `${prefix}impo-to-yard` &&
          step.id !== `${prefix}impo-arrive-yard`,
      )
      .map((step) =>
        step.id === `${prefix}impo-unmounting` ||
        step.id === `${prefix}impo-close`
          ? {
              ...step,
              travelState: "EN_CLIENTE",
              ...(step.id === `${prefix}impo-close` ? { stopOrder: 1 } : {}),
            }
          : step,
      );
  }

  if (operation.isAmparado) {
    const operationLabel = operation.isAnticipada
      ? `EXPO ANTICIPADA #${operation.id}`
      : `${operation.type === "IMPORTACION" ? "IMPO" : "EXPO"} #${operation.id}`;
    steps = steps.map((step) => {
      if (!step.evidenceTypes?.some(
        (type) => type === PORT_ENTRY_EVIDENCE || type === PORT_EXIT_EVIDENCE,
      )) return step;
      return {
        ...step,
        label: step.label.includes(operationLabel)
          ? step.label
          : `${step.label} · ${operationLabel}`,
      };
    });
  }
  return [PLATE_VERIFICATION_STEP, ...steps];
}

export function OperationWorkflow({
  operation,
  containerCardRef,
  isLoading: isProcessing,
  blockingOperationId,
  onUpdateState,
  onUpdateContainerStatus,
  onCompleteStop,
  onUpdateSealNumber,
  onReportDeviation,
  onReportExtra,
  onOpenOcrModal,
  onOpenPlateVerification,
  onOpenEvidenceModal,
  onOpenExportSealModal,
  onOpenClosingModal,
}: OperationWorkflowProps) {
  const isLoading = isProcessing;
  const [sealNumber, setSealNumber] = useState(operation.sealNumber || "");
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(
      () => setCurrentTime(new Date()),
      60_000,
    );
    return () => window.clearInterval(interval);
  }, []);
  const currentState = normalizeTravelState(operation.estadoViaje);
  const isWaitingForAmparoExport =
    operation.isAmparado === true &&
    operation.type === "IMPORTACION" &&
    operation.amparoExportFinished === false;
  const isFinished =
    operation.status === "CIERRE_FISICO" ||
    operation.status === "FINALIZADO" ||
    currentState === "FINALIZADO" ||
    currentState === "CONTENEDOR_LIBRE";
  const stateOrder =
    operation.type === "MOVIMIENTO_INTERNO"
      ? INTERNAL_MOVEMENT_STATE_ORDER
      : operation.isContainerized !== true
      ? LOOSE_CARGO_STATE_ORDER
      : operation.type === "DEVOLUCION_VACIO"
        ? EMPTY_RETURN_STATE_ORDER
        : operation.type === "RETIRO_VACIO"
          ? EMPTY_PICKUP_STATE_ORDER
          : operation.type === "EXPORTACION" ||
              operation.type === "EXPORTACION_ANTICIPADA" ||
              operation.isAnticipada
            ? EXPORT_STATE_ORDER
            : IMPORT_STATE_ORDER;

  const workflowSteps = resolveDriverWorkflowSteps(operation);
  const isExportWorkflow =
    operation.type === "EXPORTACION" ||
    operation.type === "EXPORTACION_ANTICIPADA" ||
    Boolean(operation.isAnticipada);

  const firstIncompleteStep = workflowSteps.findIndex(
    (step) => !isStepComplete(step, operation, currentState, stateOrder),
  );
  const currentIndex = isFinished
    ? workflowSteps.length
    : firstIncompleteStep < 0
      ? workflowSteps.length
      : firstIncompleteStep;
  const activeStep = isFinished ? undefined : workflowSteps[currentIndex];
  const requiredContainerAction =
    operation.isContainerized !== true ||
    isFinished ||
    activeStep?.action === "container-status"
      ? null
      : getRequiredContainerAction(
          operation,
          activeStep?.requiresContainerStatus,
        );
  const currentCargoStatus = operation.cargoStatus || "PENDIENTE";
  const requiredCargoStatuses = activeStep?.requiresCargoStatus ?? [];
  const missingCargoStatus =
    requiredCargoStatuses.length > 0 &&
    !requiredCargoStatuses.includes(currentCargoStatus);
  const scrollToStatusCard = () => {
    containerCardRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };
  const travelStartDate = getTravelStartDate(operation, activeStep?.nextState);
  const missingMandatoryAppointments =
    activeStep?.nextState &&
    TRAVEL_START_STATES.has(activeStep.nextState)
      ? getMissingMandatoryAppointments(operation)
      : [];
  const isTravelStartBlocked =
    Boolean(activeStep?.nextState) &&
    TRAVEL_START_STATES.has(activeStep?.nextState ?? "") &&
    (
      missingMandatoryAppointments.length > 0 ||
      !isSameColombiaDate(travelStartDate, currentTime)
    );
  const isWaitingForDeviationConfirmation =
    operation.isContainerized === true &&
    operation.status === "DESVIO_REPORTADO" &&
    operation.containerStatus === "PENDIENTE_DEVOLUCION" &&
    (!operation.nuevoDestinoId || !operation.fechaCitaDesvio);

  const handleAction = async (step: WorkflowStep) => {
    if (isWaitingForAmparoExport) return;
    const opensModal =
      step.action === "ocr" ||
      step.action === "evidence" ||
      step.id === "expo-seal-and-closed-container-photo";
    if (
      step.containerStatus &&
      step.action !== "container-status" &&
      !opensModal
    ) {
      await onUpdateContainerStatus(operation.id, step.containerStatus);
    }
    if (step.action === "verify-plates") {
      onOpenPlateVerification();
    } else if (step.action === "container-status") {
      if (step.containerStatus) {
        await onUpdateContainerStatus(operation.id, step.containerStatus);
      }
    } else if (step.id === "expo-seal-and-closed-container-photo") {
      onOpenExportSealModal(operation.id, step.containerStatus);
    } else if (step.action === "ocr") onOpenOcrModal(step.containerStatus);
    else if (step.action === "close") onOpenClosingModal();
    else if (step.action === "evidence") {
      onOpenEvidenceModal(
        operation.id,
        step.evidenceTypes ?? [],
        step.nextState,
        step.beforeState,
        step.containerStatus,
      );
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

      {operation.isContainerized !== true ? (
        <section
          ref={containerCardRef}
          className={`${styles.containerStatusSection} ${
            missingCargoStatus ? styles.containerStatusAttention : ""
          }`}
        >
          <h3 className={styles.title}>DATOS DE CARGA SUELTA</h3>
          {operation.stops && operation.stops.length > 0 && (
            <section aria-label="Ruta de paradas">
              <h4>Paradas de la ruta</h4>
              <ol>
                {[...operation.stops]
                  .sort((left, right) => left.stopOrder - right.stopOrder)
                  .map((stop) => (
                    <li key={stop.id} style={{ marginBottom: 12 }}>
                      <strong>
                        {stop.stopType === "CARGUE" ? "Cargue" : "Descargue"} ·{" "}
                        {stop.location?.name ||
                          stop.address ||
                          "Dirección pendiente"}
                      </strong>
                      <div>{stop.client.razonSocial}</div>
                      {(stop.address || stop.location?.address) && (
                        <div>{stop.address || stop.location?.address}</div>
                      )}
                      {stop.contactName && (
                        <div>Contacto: {stop.contactName}</div>
                      )}
                      {stop.contactPhone && (
                        <div>Teléfono: {stop.contactPhone}</div>
                      )}
                      {stop.observations && (
                        <div>Observaciones: {stop.observations}</div>
                      )}
                      {stop.cargoDescription && (
                        <div>{stop.cargoDescription}</div>
                      )}
                      {stop.weightKg != null && <div>{stop.weightKg} kg</div>}
                          <div>Estado: {formatOperationStateLabel(stop.status)}</div>
                      {stop.status !== "COMPLETADA" &&
                        ((stop.stopType === "CARGUE" &&
                          currentState === "LLEGADA_ORIGEN") ||
                          (stop.stopType === "DESCARGUE" &&
                            currentState === "LLEGADA_DESTINO")) && (
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            {stop.stopType === "DESCARGUE" && (
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() =>
                                  onOpenEvidenceModal(operation.id, [
                                    "ANOMALY_PHOTO",
                                  ])
                                }
                              >
                                Subir fotos de anomalías
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="primary"
                              disabled={isLoading}
                              onClick={() =>
                                void onCompleteStop(operation.id, stop.id)
                              }
                            >
                              Completar parada
                            </Button>
                          </div>
                        )}
                    </li>
                  ))}
              </ol>
            </section>
          )}
          <p>{operation.cargoDescription || "Descripción pendiente"}</p>
          <p>Peso: {operation.weight ?? "Pendiente"}</p>
          <p>Dimensiones: {operation.dimensions || "Pendientes"}</p>
          <p>
            Estado de la carga:{" "}
            {formatOperationStateLabel(operation.cargoStatus || "PENDIENTE")}
          </p>
          <p>
            El estado de la carga se actualiza automáticamente al registrar las
            evidencias de cargue y descargue.
          </p>
          <div className={styles.containerTimes}>
            <p>
              Cargue: {formatTimestamp(operation.loadingStartedAt)} —{" "}
              {formatTimestamp(operation.loadingCompletedAt)}
            </p>
            <p>
              Descargue: {formatTimestamp(operation.unloadingStartedAt)} —{" "}
              {formatTimestamp(operation.unloadingCompletedAt)}
            </p>
          </div>
        </section>
      ) : (
        <section
          ref={containerCardRef}
          className={`${styles.containerStatusSection} ${
            requiredContainerAction ? styles.containerStatusAttention : ""
          }`}
        >
          <h3 className={styles.title}>ESTADO DEL CONTENEDOR</h3>
          <p>
            Número: {operation.containerNumber || "Pendiente de validación OCR"}
          </p>
          <label
            className={styles.containerStatusLabel}
            htmlFor={`seal-number-${operation.id}`}
          >
            Número de sello / precinto *
          </label>
          <div className={styles.sealNumberControls}>
            <input
              id={`seal-number-${operation.id}`}
              className={styles.sealNumberInput}
              value={sealNumber}
              onChange={(event) => setSealNumber(event.target.value)}
              maxLength={100}
              required
              placeholder="Ingresa el número de sello o precinto"
              disabled={isLoading}
            />
            <Button
              variant="secondary"
              isLoading={isLoading}
              disabled={
                isLoading ||
                !sealNumber.trim() ||
                sealNumber.trim() === operation.sealNumber
              }
              onClick={() =>
                void onUpdateSealNumber(operation.id, sealNumber.trim()).catch(
                  () => undefined,
                )
              }
            >
              Guardar sello
            </Button>
          </div>
          <p className={styles.containerStatusCurrent}>
            Estado actual:{" "}
            <strong>
              {formatOperationStateLabel(operation.containerStatus || "PENDIENTE")}
            </strong>
          </p>
          {activeStep?.instruction && (
            <p className={styles.containerHint} role="status">
              {activeStep.instruction}
            </p>
          )}
          {requiredContainerAction && (
            <p className={styles.containerHint} role="alert">
              El estado del contenedor avanzará automáticamente a{" "}
              <strong>{formatOperationStateLabel(requiredContainerAction)}</strong>{" "}
              al completar el paso y registrar su evidencia.
            </p>
          )}
          {operation.type === "IMPORTACION" &&
            currentState === "LLEGADA_DESTINO" &&
            ["EN_INSPECCION", "FALLA_REPORTADA"].includes(
              operation.containerStatus || "",
            ) && (
              <Button
                variant="secondary"
                disabled={isLoading || isWaitingForAmparoExport}
                onClick={() => onReportDeviation()}
              >
                Reportar desvío
              </Button>
            )}
          {(operation.type === "IMPORTACION" ||
            operation.type === "DEVOLUCION_VACIO") &&
            currentState === "LLEGADA_DESTINO" && (
              <Button
                variant="secondary"
                disabled={isLoading || isWaitingForAmparoExport}
                onClick={() => onReportDeviation("PATIO_LLENO")}
              >
                Reportar desvío de patio
              </Button>
            )}
          <div className={styles.containerTimes}>
            <p>
              Cargue: {formatTimestamp(operation.loadingStartedAt)} —{" "}
              {formatTimestamp(operation.loadingCompletedAt)}
            </p>
            <p>
              Descargue: {formatTimestamp(operation.unloadingStartedAt)} —{" "}
              {formatTimestamp(operation.unloadingCompletedAt)}
            </p>
          </div>
        </section>
      )}

      {!isFinished && operation.status !== "CANCELADO" && (
        <section className={styles.containerStatusSection}>
          <h3 className={styles.title}>REPORTAR NOVEDAD / COBRO EXTRA</h3>
          <p>
            Selecciona un concepto del catálogo, describe lo ocurrido y adjunta
            una foto si la tienes. El analista recibirá el reporte para
            valoración; no se asigna ningún valor desde el portal.
          </p>
          <Button
            type="button"
            variant="secondary"
            disabled={isLoading || isWaitingForAmparoExport}
            onClick={() => onReportExtra(operation.id)}
          >
            Reportar novedad / cobro extra
          </Button>
        </section>
      )}

      <div className={styles.header}>
        <h3 className={styles.title}>SECUENCIA DEL VIAJE</h3>
        <span className={styles.stepCounter}>
          Paso {Math.min(currentIndex + 1, workflowSteps.length)} de{" "}
          {workflowSteps.length}
        </span>
      </div>

      <ContainerRollback
        operationId={operation.id}
        enabled={operation.isContainerized === true && (operation.status === "EN_CURSO" || operation.status === "ASIGNADO") && hasValidEvidence(operation, CONTAINER_NUMBER_EVIDENCE)}
        disabled={isLoading || isWaitingForAmparoExport}
        onCapture={onOpenOcrModal}
      />

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
              <div
                className={`${styles.line} ${index < currentIndex ? styles.lineCompleted : ""}`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className={styles.actionList}>
        {isTravelStartBlocked && (
          <p className={styles.startBlockedNotice} role="status">
            {missingMandatoryAppointments.length > 0
              ? `No puedes iniciar el viaje: faltan ${missingMandatoryAppointments.join(" y ")}.`
              : travelStartDate
              ? `Solo puedes iniciar el viaje el ${new Date(travelStartDate).toLocaleDateString("es-CO", { timeZone: "America/Bogota" })}.`
              : "La operación no tiene una fecha programada para iniciar este trayecto. Contacta al analista."}
          </p>
        )}
        {workflowSteps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;
          const missingContainerStatus =
            isActive &&
            !isContainerReady(operation, step.requiresContainerStatus);
          const missingCargoStatus =
            isActive &&
            Boolean(step.requiresCargoStatus?.length) &&
            !step.requiresCargoStatus?.includes(
              operation.cargoStatus || "PENDIENTE",
            );
          const isAutomaticStatusStep =
            step.action === "evidence" ||
            step.action === "ocr" ||
            step.action === "container-status";
          const isSealEntryStep =
            step.id === "expo-seal-and-closed-container-photo";
          const missingPrerequisites =
            isActive &&
            (!hasRequiredEvidence(operation, step) ||
              (!isAutomaticStatusStep &&
                Boolean(step.requiresCargoStatus?.length) &&
                !step.requiresCargoStatus?.includes(
                  operation.cargoStatus || "PENDIENTE",
                )) ||
              (!isSealEntryStep &&
                step.requiresSeal &&
                !operation.sealNumber?.trim()));
          const missingRequirements: string[] = [];
          if (
            isActive &&
            missingContainerStatus
          ) {
            missingRequirements.push(
              `Estado del contenedor: ${(step.requiresContainerStatus ?? []).map(formatOperationStateLabel).join(" o ")}.`,
            );
          }
          if (isActive) {
            for (const type of step.requiresEvidence ?? []) {
              const stage =
                step.requiresEvidenceStages?.[type] ??
                step.requiresEvidenceStage;
              const hasAlternativeExportPhoto =
                type === LOADING_PHOTO_EVIDENCE &&
                (operation.type === "EXPORTACION" ||
                  operation.type === "EXPORTACION_ANTICIPADA" ||
                  operation.isAnticipada) &&
                hasValidEvidence(operation, SEAL_EVIDENCE);
              if (
                !hasAlternativeExportPhoto &&
                !hasStageEvidence(operation, type, stage)
              ) {
                const label =
                  type === LOADING_PHOTO_EVIDENCE
                    ? "foto del cargue"
                    : type === CONTAINER_NUMBER_EVIDENCE
                      ? "validación OCR del contenedor"
                      : formatEvidenceTypeLabel(type).toLowerCase();
                missingRequirements.push(`Soporte pendiente: ${label}.`);
              }
            }
            if (step.requiresSeal && !operation.sealNumber?.trim()) {
              missingRequirements.push("Registra el número de sello o precinto.");
            }
            if (missingCargoStatus) {
              missingRequirements.push(
                `Estado de carga: ${(step.requiresCargoStatus ?? []).map(formatOperationStateLabel).join(" o ")}.`,
              );
            }
          }

          const isBlockedByOtherOperation =
            isWaitingForAmparoExport ||
            (isActive &&
              currentState === "ASIGNADO" &&
              operation.status !== "EN_CURSO" &&
              activeStep?.action !== "verify-plates" &&
              blockingOperationId !== undefined);

          const rejectedEvidences =
            operation.evidences?.filter(
              (ev) =>
                step.evidenceTypes?.includes(ev.type) &&
                ev.estadoRevision === "DEVUELTO",
            ) || [];
          const hasRejectedEvidence = rejectedEvidences.length > 0;
          const rejectedNote = rejectedEvidences
            .map((ev) => ev.notaAnalista)
            .filter(Boolean)
            .join(" / ");

          const isClickable = isActive || hasRejectedEvidence;
          const statusOnlyBlocker =
            isActive &&
            (missingContainerStatus || missingCargoStatus) &&
            !isAutomaticStatusStep &&
            missingRequirements.every(
              (requirement) =>
                requirement.startsWith("Estado del contenedor:") ||
                requirement.startsWith("Estado de carga:"),
            ) &&
            !hasRejectedEvidence &&
            !isLoading &&
            isClickable &&
            !isBlockedByOtherOperation &&
            !isWaitingForDeviationConfirmation &&
            !isTravelStartBlocked;
          const isDisabled =
            isLoading ||
            !isClickable ||
            missingPrerequisites ||
            isBlockedByOtherOperation ||
            isWaitingForDeviationConfirmation ||
            (isActive && isTravelStartBlocked);

          const cardRequirements =
            isActive && isWaitingForAmparoExport
              ? [
                  ...missingRequirements,
                  `Inicia esta importación cuando finalice la exportación amparada #${operation.amparoExportOperationId ?? "—"}.`,
                ]
              : isActive && isBlockedByOtherOperation
                ? [
                    ...missingRequirements,
                    `Finaliza primero la operación #${blockingOperationId}.`,
                  ]
                : missingRequirements;
          return (
            <WorkflowStepCard
              key={step.id}
              label={step.label}
              isCompleted={isCompleted}
              isActive={isActive}
              isRejected={hasRejectedEvidence}
              isDisabled={isDisabled}
              isBlockedByOtherOperation={isBlockedByOtherOperation}
              isStatusOnlyBlocker={statusOnlyBlocker}
              missingRequirements={cardRequirements}
              instruction={isActive ? step.instruction : undefined}
              rejectedNote={rejectedNote}
              onStatusClick={scrollToStatusCard}
              onKeyDownStatus={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  scrollToStatusCard();
                }
              }}
              onClick={() => {
                if (!isClickable) return;
                if (statusOnlyBlocker) {
                  scrollToStatusCard();
                  return;
                }
                const requiredStatus = isActive && !isAutomaticStatusStep
                  ? getRequiredContainerAction(
                      operation,
                      step.requiresContainerStatus,
                    )
                  : null;
                if (requiredStatus) {
                  scrollToStatusCard();
                  return;
                }
                if (missingCargoStatus && !isAutomaticStatusStep) {
                  scrollToStatusCard();
                  return;
                }
                void handleAction(step).catch(() => undefined);
              }}
            />
          );
        })}
        {isFinished && (
          <div className={styles.finalizedState}>
            <span>{operation.status === "CIERRE_FISICO" ? "📄" : "🎉"}</span>{" "}
            {operation.status === "CIERRE_FISICO"
              ? "CIERRE FÍSICO COMPLETADO · PENDIENTE DE REVISIÓN DOCUMENTAL"
              : "VIAJE FINALIZADO"}
          </div>
        )}
      </div>
    </div>
  );
}
