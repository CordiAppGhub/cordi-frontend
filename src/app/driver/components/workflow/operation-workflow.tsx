"use client";

import React, { useEffect, useState } from "react";
import styles from "./operation-workflow.module.css";
import { Button } from "@/components/atoms/button/button";
import { Select } from "@/components/atoms/select/select";
import { ContainerRollback } from "./container-rollback";
import { ContainerStateRollback } from "./container-state-rollback";
import { useIsMutating } from "@tanstack/react-query";
import {
  CargoStatus,
  OperationContainerStatus,
} from "@/types/driver-portal.types";

const PORT_ENTRY_EVIDENCE = "INGRESO_PUERTO";
const SEAL_EVIDENCE = "SELLOS_CONTENEDOR";
const PORT_EXIT_EVIDENCE = "SALIDA_PUERTO";
const COMODATO_EVIDENCE = "COMODATO";
const TIRILLA_EIR_EVIDENCE = "TIRILLA_EIR";
const LOADING_PHOTO_EVIDENCE = "FOTO_CARGUE";
const CONTAINER_NUMBER_EVIDENCE = "Número de contenedor";
const LOOSE_CARGO_EVIDENCE = "EVIDENCIA_CARGA_SUELTA";
const LOOSE_CARGO_ARRIVAL_EVIDENCE = "FOTOS_LLEGADA_CARGA_SUELTA";
const LOOSE_CARGO_UNLOADING_EVIDENCE = "FOTOS_DESCARGUE_CARGA_SUELTA";
const DELIVERY_DOC_EVIDENCE = "DELIVERY_DOC";
const CAB_PLATE_EVIDENCE = "VERIFICACION_PLACA_CABEZOTE";
const TRAILER_PLATE_EVIDENCE = "VERIFICACION_PLACA_TRAILER";

interface OperationData {
  id: number;
  type?: string;
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
    status: string;
    client: { razonSocial: string };
    location: { name: string; address?: string | null } | null;
  }>;
  evidences?: Array<{
    id: number;
    type: string;
    estadoRevision: string;
    notaAnalista?: string | null;
  }>;
  trailer?: { plate: string };
  isAmparado?: boolean;
  amparoExportOperationId?: number | null;
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
  onOpenOcrModal: () => void;
  onOpenPlateVerification: () => void;
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
  action: "update" | "ocr" | "close" | "evidence" | "verify-plates";
  evidenceTypes?: string[];
  requiresEvidence?: string[];
  requiresContainerStatus?: OperationContainerStatus[];
  requiresCargoStatus?: CargoStatus[];
  requiresSeal?: boolean;
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
  "RUMBO_AL_CLIENTE",
  "EN_CLIENTE",
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
  if (
    nextState === "EN_RUTA_ORIGEN" &&
    operation.containerStatus === "PENDIENTE_DEVOLUCION"
  ) {
    return operation.fechaCitaDesvio ?? null;
  }
  if (operation.isContainerized === false && operation.scheduledAt) {
    return operation.scheduledAt;
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
  if (step.action === "verify-plates") {
    if (operation.status !== "ASIGNADO") return true;
    return Boolean(
      hasValidEvidence(operation, CAB_PLATE_EVIDENCE) &&
      hasValidEvidence(operation, TRAILER_PLATE_EVIDENCE),
    );
  }

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
    id: "empty-pickup-ocr",
    travelState: "ASIGNADO",
    label: "ESCANEAR CONTENEDOR (OCR)",
    action: "ocr",
  },
  {
    id: "empty-pickup-depart",
    travelState: "ASIGNADO",
    label: "REPORTAR SALIDA DEL PATIO",
    nextState: "RUMBO_AL_CLIENTE",
    action: "update",
    requiresEvidence: [CONTAINER_NUMBER_EVIDENCE],
    requiresSeal: true,
  },
  {
    id: "empty-pickup-arrive",
    travelState: "RUMBO_AL_CLIENTE",
    label: "REPORTAR LLEGADA AL CLIENTE",
    nextState: "EN_CLIENTE",
    action: "update",
  },
  {
    id: "empty-pickup-close",
    travelState: "EN_CLIENTE",
    label: "SUBIR SOPORTE Y FINALIZAR",
    nextState: "FINALIZADO",
    action: "close",
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
    id: "empty-return-depart-destination",
    travelState: "LLEGADA_ORIGEN",
    label: "INICIAR TRASLADO AL DEPÓSITO O PUERTO",
    nextState: "EN_RUTA_DESTINO",
    action: "update",
  },
  {
    id: "empty-return-arrive-destination",
    travelState: "EN_RUTA_DESTINO",
    label: "REPORTAR LLEGADA AL DEPÓSITO O PUERTO",
    nextState: "LLEGADA_DESTINO",
    action: "update",
  },
  {
    id: "empty-return-close",
    travelState: "LLEGADA_DESTINO",
    label: "SUBIR TIRILLA EIR Y FINALIZAR",
    nextState: "FINALIZADO",
    action: "close",
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
  },
  {
    id: "loose-cargo-evidence",
    travelState: "LLEGADA_ORIGEN",
    label: "SUBIR EVIDENCIA CARGA SUELTA",
    nextState: "EN_RUTA_DESTINO",
    action: "evidence",
    evidenceTypes: [LOOSE_CARGO_EVIDENCE],
    requiresCargoStatus: ["CARGADO"],
    instruction:
      "Envía cuatro fotos de la carga: de frente, de atrás y de ambos lados.",
  },
  {
    id: "loose-cargo-arrive-destination",
    travelState: "EN_RUTA_DESTINO",
    label: "REPORTAR LLEGADA AL DESTINO",
    nextState: "LLEGADA_DESTINO",
    action: "update",
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
    label: "SUBIR SOPORTE DE DESCARGADO Y DEVOLUCIÓN",
    nextState: "FINALIZADO",
    action: "evidence",
    evidenceTypes: [DELIVERY_DOC_EVIDENCE],
    requiresEvidence: [
      LOOSE_CARGO_ARRIVAL_EVIDENCE,
      LOOSE_CARGO_UNLOADING_EVIDENCE,
    ],
    requiresCargoStatus: ["DESCARGADO"],
    instruction:
      "Cuando el descargue esté finalizado, sube el soporte de descargado y devolución para cerrar el viaje.",
  },
];

const PLATE_VERIFICATION_STEP: WorkflowStep = {
  id: "verify-fleet-plates",
  travelState: "ASIGNADO",
  label: "VERIFICAR PLACAS DEL CABEZOTE Y TRÁILER",
  action: "verify-plates",
  instruction:
    "Antes de iniciar el viaje, confirma con fotos que el cabezote y el tráiler correspondan a esta operación.",
};

const LOOSE_CARGO_STATUS_TRANSITIONS: Partial<
  Record<CargoStatus, CargoStatus[]>
> = {
  PENDIENTE: ["EN_CARGUE"],
  EN_CARGUE: ["CARGADO"],
  CARGADO: ["EN_DESCARGUE"],
  EN_DESCARGUE: ["DESCARGADO"],
};

const IMPORT_TO_YARD_STEPS: WorkflowStep[] = [
  {
    id: "impo-start",
    travelState: "ASIGNADO",
    label: "INICIAR VIAJE AL PUERTO",
    nextState: "RUMBO_AL_PUERTO",
    action: "update",
  },
  {
    id: "impo-arrive-port",
    travelState: "RUMBO_AL_PUERTO",
    label: "REPORTAR LLEGADA AL PUERTO",
    nextState: "EN_PUERTO",
    action: "update",
  },
  {
    id: "impo-port-entry",
    travelState: "EN_PUERTO",
    label: "SUBIR ARIN DE INGRESO A PUERTO",
    action: "evidence",
    evidenceTypes: [PORT_ENTRY_EVIDENCE],
  },
  {
    id: "impo-ocr",
    travelState: "EN_PUERTO",
    label: "ESCANEAR CONTENEDOR (OCR)",
    action: "ocr",
    requiresContainerStatus: ["EN_CARGUE", "CARGADO"],
    instruction:
      "Antes de escanear, reporta el estado del contenedor como EN CARGUE.",
  },
  {
    id: "impo-seals",
    travelState: "EN_PUERTO",
    label: "SUBIR FOTOS DE LOS SELLOS",
    action: "evidence",
    evidenceTypes: [SEAL_EVIDENCE],
    requiresEvidence: [CONTAINER_NUMBER_EVIDENCE],
    requiresContainerStatus: ["CARGADO"],
    instruction:
      "El contenedor ya debe estar montado: márcalo como CARGADO y luego sube las fotos de los sellos.",
  },
  {
    id: "impo-leave-port",
    travelState: "EN_PUERTO",
    label: "SUBIR ARIN DE SALIDA E INICIAR RUTA A CLIENTE",
    nextState: "RUMBO_AL_CLIENTE",
    action: "evidence",
    evidenceTypes: [PORT_EXIT_EVIDENCE],
    requiresEvidence: [PORT_ENTRY_EVIDENCE, SEAL_EVIDENCE, CONTAINER_NUMBER_EVIDENCE],
    requiresContainerStatus: ["CARGADO"],
    requiresSeal: true,
  },
  {
    id: "impo-arrive-client",
    travelState: "RUMBO_AL_CLIENTE",
    label: "REPORTAR LLEGADA AL CLIENTE",
    nextState: "EN_CLIENTE",
    action: "update",
  },
  {
    id: "impo-to-yard",
    travelState: "EN_CLIENTE",
    label: "INICIAR TRASLADO AL PATIO DE VACÍOS",
    nextState: "EN_RUTA_DESTINO",
    action: "update",
    requiresContainerStatus: ["DESCARGADO", "EN_PISO"],
    instruction:
      "Antes de ir al patio, reporta el descargue en el cliente (DESCARGADO o bajado a piso).",
  },
  {
    id: "impo-arrive-yard",
    travelState: "EN_RUTA_DESTINO",
    label: "REPORTAR LLEGADA AL PATIO",
    nextState: "LLEGADA_DESTINO",
    action: "update",
  },
  {
    id: "impo-close",
    travelState: "LLEGADA_DESTINO",
    label: "SUBIR TIRILLA EIR DE DEVOLUCIÓN Y FINALIZAR",
    nextState: "FINALIZADO",
    action: "evidence",
    evidenceTypes: [TIRILLA_EIR_EVIDENCE],
    instruction:
      "Adjunta la Tirilla EIR emitida por el depósito o puerto. El comodato es un documento distinto y no reemplaza este soporte.",
  },
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
    label: "REPORTAR LLEGADA AL PATIO DE VACÍOS",
    nextState: "LLEGADA_ORIGEN",
    action: "update",
  },
  {
    id: "expo-ocr",
    travelState: "LLEGADA_ORIGEN",
    label: "ESCANEAR CONTENEDOR VACÍO (OCR)",
    action: "ocr",
  },
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
  {
    id: "expo-arrive-client",
    travelState: "RUMBO_AL_CLIENTE",
    label: "REPORTAR LLEGADA A CLIENTE",
    nextState: "EN_CLIENTE",
    action: "update",
  },
  {
    id: "expo-loading-photo",
    travelState: "EN_CLIENTE",
    label: "SUBIR FOTO CARGANDO EL CONTENEDOR",
    action: "evidence",
    evidenceTypes: [LOADING_PHOTO_EVIDENCE],
    instruction:
      "Toma la foto del cargue y reporta el estado del contenedor como EN CARGUE.",
  },
  {
    id: "expo-to-port",
    travelState: "EN_CLIENTE",
    label: "INICIAR VIAJE AL PUERTO",
    nextState: "RUMBO_AL_PUERTO",
    action: "update",
    requiresEvidence: [LOADING_PHOTO_EVIDENCE, CONTAINER_NUMBER_EVIDENCE],
    requiresContainerStatus: ["CARGADO"],
    requiresSeal: true,
    instruction:
      "Antes de salir al puerto, finaliza el cargue y reporta el contenedor como CARGADO.",
  },
  {
    id: "expo-arrive-port",
    travelState: "RUMBO_AL_PUERTO",
    label: "REPORTAR LLEGADA AL PUERTO",
    nextState: "EN_PUERTO",
    action: "update",
  },
  {
    id: "expo-port-entry",
    travelState: "EN_PUERTO",
    label: "SUBIR ARIN DE INGRESO A PUERTO",
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
    instruction:
      "Entrega el contenedor en puerto: márcalo como DESCARGADO y luego sube el ARIN de salida.",
  },
];

const AMPARADO_EXPORT_STEPS: WorkflowStep[] = EXPORT_STEPS.map((step) =>
  step.id === "expo-close"
    ? {
        ...step,
        id: "amparo-expo-close",
        label: "FINALIZAR AL REPORTAR DESCARGADO",
        action: "update",
        evidenceTypes: undefined,
        instruction:
          "Reporta EN DESCARGUE y después DESCARGADO. La exportación finalizará y se usará el mismo ARIN de ingreso para el amparo.",
      }
    : { ...step, id: `amparo-${step.id}` },
);

const AMPARADO_IMPORT_STEPS: WorkflowStep[] = [
  {
    id: "amparo-impo-port-entry",
    travelState: "EN_PUERTO",
    label: "SUBIR ARIN DE INGRESO A PUERTO",
    action: "evidence",
    evidenceTypes: [PORT_ENTRY_EVIDENCE],
  },
  {
    id: "amparo-impo-ocr",
    travelState: "EN_PUERTO",
    label: "ESCANEAR NUEVO CONTENEDOR (OCR)",
    action: "ocr",
    requiresContainerStatus: ["EN_CARGUE", "CARGADO"],
    instruction:
      "Estás en puerto por triangulación. Reporta EN CARGUE y escanea el nuevo contenedor.",
  },
  {
    id: "amparo-impo-seals",
    travelState: "EN_PUERTO",
    label: "SUBIR FOTOS DE LOS SELLOS",
    action: "evidence",
    evidenceTypes: [SEAL_EVIDENCE],
    requiresEvidence: [CONTAINER_NUMBER_EVIDENCE],
    requiresContainerStatus: ["CARGADO"],
    instruction:
      "Marca el contenedor como CARGADO y sube las fotos de los sellos.",
  },
  {
    id: "amparo-impo-leave-port",
    travelState: "EN_PUERTO",
    label: "SUBIR SOPORTE DE SALIDA (SALIDA_PUERTO)",
    action: "evidence",
    evidenceTypes: [PORT_EXIT_EVIDENCE],
    requiresEvidence: [SEAL_EVIDENCE, CONTAINER_NUMBER_EVIDENCE],
    requiresContainerStatus: ["CARGADO"],
    instruction:
      "Sube el soporte de salida del puerto para habilitar la ruta al cliente.",
  },
  {
    id: "amparo-impo-to-client",
    travelState: "EN_PUERTO",
    label: "INICIAR RUTA A CLIENTE",
    nextState: "RUMBO_AL_CLIENTE",
    action: "update",
    // 🚀 Aseguramos que requiera la evidencia de salida antes de iniciar ruta
    requiresEvidence: [
      PORT_ENTRY_EVIDENCE,
      PORT_EXIT_EVIDENCE,
      SEAL_EVIDENCE,
      CONTAINER_NUMBER_EVIDENCE,
    ],
    requiresContainerStatus: ["CARGADO"],
  },
  ...IMPORT_TO_YARD_STEPS.filter((step) =>
    [
      "impo-arrive-client",
      "impo-to-yard",
      "impo-arrive-yard",
      "impo-close",
    ].includes(step.id),
  ).map((step) => ({ ...step, id: `amparo-${step.id}` })),
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

export function OperationWorkflow({
  operation,
  isLoading: isProcessing,
  blockingOperationId,
  onUpdateState,
  onUpdateContainerStatus,
  onUpdateCargoStatus,
  onCompleteStop,
  onUpdateSealNumber,
  onReportDeviation,
  onOpenOcrModal,
  onOpenPlateVerification,
  onOpenEvidenceModal,
  onOpenClosingModal,
}: OperationWorkflowProps) {
  const isCorrecting = useIsMutating({
    mutationKey: ["container-rollback-mutation", operation.id],
  }) > 0;
  const isLoading = isProcessing || isCorrecting;
  const [selectedContainerStatus, setSelectedContainerStatus] =
    useState<OperationContainerStatus>(
      operation.containerStatus || "PENDIENTE",
    );
  const [selectedCargoStatus, setSelectedCargoStatus] = useState<CargoStatus>(
    operation.cargoStatus || "PENDIENTE",
  );
  const [sealNumber, setSealNumber] = useState(operation.sealNumber || "");
  const [issueDescription, setIssueDescription] = useState("");
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(
      () => setCurrentTime(new Date()),
      60_000,
    );
    return () => window.clearInterval(interval);
  }, []);
  const currentState = normalizeTravelState(operation.estadoViaje);
  const isFinished =
    operation.status === "CIERRE_FISICO" ||
    operation.status === "FINALIZADO" ||
    currentState === "FINALIZADO" ||
    currentState === "CONTENEDOR_LIBRE";
  const stateOrder =
    operation.isContainerized === false
      ? LOOSE_CARGO_STATE_ORDER
      : operation.type === "DEVOLUCION_VACIO"
        ? EMPTY_RETURN_STATE_ORDER
        : operation.type === "RETIRO_VACIO"
          ? EMPTY_PICKUP_STATE_ORDER
          : operation.type === "EXPORTACION"
            ? EXPORT_STATE_ORDER
            : IMPORT_STATE_ORDER;

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

  if (operation.isContainerized === false) {
    workflowSteps = LOOSE_CARGO_STEPS;
  } else if (operation.type === "DEVOLUCION_VACIO") {
    workflowSteps = EMPTY_RETURN_STEPS;
  } else if (operation.type === "RETIRO_VACIO") {
    workflowSteps = EMPTY_PICKUP_STEPS;
  }
  workflowSteps = [PLATE_VERIFICATION_STEP, ...workflowSteps];

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

  const handleAction = (step: WorkflowStep) => {
    if (step.action === "verify-plates") {
      onOpenPlateVerification();
    } else if (step.action === "ocr") onOpenOcrModal();
    else if (step.action === "close") onOpenClosingModal();
    else if (step.action === "evidence") {
      onOpenEvidenceModal(
        operation.id,
        step.evidenceTypes ?? [],
        step.nextState,
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

      {operation.isContainerized === false ? (
        <section className={styles.containerStatusSection}>
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
                      <div>Estado: {stop.status.replace(/_/g, " ")}</div>
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
            {(operation.cargoStatus || "PENDIENTE").replace(/_/g, " ")}
          </p>
          <label
            className={styles.containerStatusLabel}
            htmlFor={`cargo-status-${operation.id}`}
          >
            Reportar estado de carga
          </label>
          <Select
            id={`cargo-status-${operation.id}`}
            className={styles.containerStatusSelect}
            value={selectedCargoStatus}
            onChange={(event) =>
              setSelectedCargoStatus(event.target.value as CargoStatus)
            }
            disabled={isLoading}
          >
            <option value={operation.cargoStatus || "PENDIENTE"}>
              {(operation.cargoStatus || "PENDIENTE").replace(/_/g, " ")}
            </option>
            {(
              LOOSE_CARGO_STATUS_TRANSITIONS[
                operation.cargoStatus || "PENDIENTE"
              ] ?? []
            ).map((status) => (
              <option
                key={status}
                value={status}
                disabled={
                  (status === "EN_CARGUE" &&
                    currentState !== "LLEGADA_ORIGEN") ||
                  (status === "EN_DESCARGUE" &&
                    currentState !== "LLEGADA_DESTINO")
                }
              >
                {status.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
          <Button
            variant="primary"
            isLoading={isLoading}
            disabled={
              isLoading ||
              selectedCargoStatus === (operation.cargoStatus || "PENDIENTE")
            }
            onClick={() =>
              void onUpdateCargoStatus(operation.id, selectedCargoStatus).catch(
                () => undefined,
              )
            }
          >
            Actualizar estado de carga
          </Button>
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
        <section className={styles.containerStatusSection}>
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
              {(operation.containerStatus || "PENDIENTE").replace(/_/g, " ")}
            </strong>
          </p>
          {(operation.status === "ASIGNADO" || operation.status === "EN_CURSO") && (
            <ContainerStateRollback
              operationId={operation.id}
              status={operation.containerStatus || "PENDIENTE"}
              disabled={isLoading}
            />
          )}
          {activeStep?.instruction && (
            <p className={styles.containerHint} role="status">
              {activeStep.instruction}
            </p>
          )}
          <label
            className={styles.containerStatusLabel}
            htmlFor={`container-status-${operation.id}`}
          >
            Reportar estado en campo
          </label>
          <Select
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
            <option value="PENDIENTE_DEVOLUCION" disabled>
              Pendiente de devolución
            </option>
            <option value="EN_INSPECCION">En inspección</option>
            <option value="FALLA_REPORTADA">Presenta una falla</option>
            <option value="EN_CARGUE">Iniciar cargue (EN CARGUE)</option>
            <option value="CARGADO">Cargue finalizado (CARGADO)</option>
            <option value="EN_DESCARGUE">Iniciar descargue</option>
            <option value="DESCARGADO">
              Descargue finalizado (DESCARGADO)
            </option>
          </Select>
          {selectedContainerStatus !== (operation.containerStatus || "PENDIENTE") && (
            <p className={styles.containerHint} role="status">
              Para guardar el cambio, pulsa «Reportar estado». El estado actual
              mostrado arriba es el registrado.
            </p>
          )}
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
            disabled={
              isLoading ||
              (selectedContainerStatus === "FALLA_REPORTADA" &&
                !issueDescription.trim())
            }
            onClick={() =>
              void onUpdateContainerStatus(
                operation.id,
                selectedContainerStatus,
                selectedContainerStatus === "FALLA_REPORTADA"
                  ? issueDescription.trim()
                  : undefined,
              ).catch(() => undefined)
            }
          >
            Reportar estado
          </Button>
          {operation.type === "IMPORTACION" &&
            currentState === "LLEGADA_DESTINO" &&
            ["EN_INSPECCION", "FALLA_REPORTADA"].includes(
              operation.containerStatus || "",
            ) && (
              <Button
                variant="secondary"
                disabled={isLoading}
                onClick={onReportDeviation}
              >
                Reportar desvío
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

      <div className={styles.header}>
        <h3 className={styles.title}>SECUENCIA DEL VIAJE</h3>
        <span className={styles.stepCounter}>
          Paso {Math.min(currentIndex + 1, workflowSteps.length)} de{" "}
          {workflowSteps.length}
        </span>
      </div>

      <ContainerRollback
        operationId={operation.id}
        enabled={operation.isContainerized !== false && (operation.status === "EN_CURSO" || operation.status === "ASIGNADO") && hasValidEvidence(operation, CONTAINER_NUMBER_EVIDENCE)}
        disabled={isLoading}
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
            {travelStartDate
              ? `Solo puedes iniciar el viaje el ${new Date(travelStartDate).toLocaleDateString("es-CO", { timeZone: "America/Bogota" })}.`
              : "La operación no tiene una fecha programada para iniciar este trayecto. Contacta al analista."}
          </p>
        )}
        {workflowSteps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;
          const missingPrerequisites =
            isActive &&
            (!isContainerReady(operation, step.requiresContainerStatus) ||
              !hasAllEvidence(operation, step.requiresEvidence) ||
              (Boolean(step.requiresCargoStatus?.length) &&
                !step.requiresCargoStatus?.includes(
                  operation.cargoStatus || "PENDIENTE",
                )) ||
              (step.requiresSeal && !operation.sealNumber?.trim()));
          const missingRequirements: string[] = [];
          if (
            isActive &&
            !isContainerReady(operation, step.requiresContainerStatus)
          ) {
            missingRequirements.push(
              `Estado del contenedor: ${(step.requiresContainerStatus ?? []).map((status) => status.replace(/_/g, " ")).join(" o ")}.`,
            );
          }
          if (isActive) {
            for (const type of step.requiresEvidence ?? []) {
              if (!hasValidEvidence(operation, type)) {
                const label =
                  type === LOADING_PHOTO_EVIDENCE
                    ? "foto del cargue"
                    : type === CONTAINER_NUMBER_EVIDENCE
                      ? "validación OCR del contenedor"
                      : type.replace(/_/g, " ").toLowerCase();
                missingRequirements.push(`Soporte pendiente: ${label}.`);
              }
            }
            if (step.requiresSeal && !operation.sealNumber?.trim()) {
              missingRequirements.push("Registra el número de sello o precinto.");
            }
            if (
              step.requiresCargoStatus?.length &&
              !step.requiresCargoStatus.includes(
                operation.cargoStatus || "PENDIENTE",
              )
            ) {
              missingRequirements.push(`Estado de carga: ${step.requiresCargoStatus.map((status) => status.replace(/_/g, " ")).join(" o ")}.`);
            }
          }

          const isBlockedByOtherOperation =
            isActive &&
            currentState === "ASIGNADO" &&
            operation.status !== "EN_CURSO" &&
            activeStep?.action !== "verify-plates" &&
            blockingOperationId !== undefined;

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
          const isDisabled =
            isLoading ||
            !isClickable ||
            step.id === "amparo-expo-close" ||
            missingPrerequisites ||
            isBlockedByOtherOperation ||
            isWaitingForDeviationConfirmation ||
            (isActive && isTravelStartBlocked);

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
                  {hasRejectedEvidence
                    ? "⚠️"
                    : isCompleted
                      ? "✅"
                      : isActive
                        ? "▶"
                        : "🔒"}
                </span>
                {step.label}
              </button>
              {isActive && step.instruction && (
                <p className={styles.stepInstruction} role="status">
                  {step.instruction}
                </p>
              )}
              {isActive && isBlockedByOtherOperation && (
                <p className={styles.startBlockedNotice} role="status">
                  Finaliza primero la operación #{blockingOperationId}. Después
                  podrás iniciar este viaje.
                </p>
              )}
              {missingRequirements.length > 0 && (
                <div className={styles.startBlockedNotice} role="status">
                  <strong>Para continuar falta:</strong>
                  <ul>
                    {missingRequirements.map((requirement) => (
                      <li key={requirement}>{requirement}</li>
                    ))}
                  </ul>
                </div>
              )}
              {hasRejectedEvidence && (
                <p role="alert" className={styles.rejectedNotice}>
                  <strong>Soporte devuelto:</strong>{" "}
                  {rejectedNote ||
                    "La evidencia no es válida, vuelve a subirla."}
                </p>
              )}
            </div>
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
