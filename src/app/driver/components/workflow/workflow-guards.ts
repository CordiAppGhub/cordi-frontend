export type WorkflowOperationType =
  | "IMPORTACION"
  | "EXPORTACION"
  | "EXPORTACION_ANTICIPADA"
  | "RETIRO_VACIO"
  | "DEVOLUCION_VACIO"
  | "MOVIMIENTO_INTERNO"
  | "NACIONAL"
  | "string";

export interface WorkflowGuardOperation {
  type?: string;
  isAnticipada?: boolean;
  isContainerized?: boolean;
  cargoType?: string | null;
  tipoCarga?: string | null;
  scheduledAt?: string | null;
  fechaCitaOrigen?: string | null;
  fechaCitaDestino?: string | null;
  containerStatus?: string | null;
  sealNumber?: string | null;
  evidences?: Array<{
    type: string;
    estadoRevision: string;
  }>;
}

export function isLooseCargoOperation(
  operation: Pick<
    WorkflowGuardOperation,
    "isContainerized" | "cargoType" | "tipoCarga"
  >,
): boolean {
  return (
    operation.isContainerized !== true ||
    operation.cargoType === "LOOSE_CARGO" ||
    operation.tipoCarga === "SUELTA"
  );
}

function getLooseCargoAppointment(
  operation: WorkflowGuardOperation,
  nextState?: string,
): { value?: string | null; label: string } {
  const startsAtOrigin =
    nextState === "EN_RUTA_ORIGEN" ||
    (nextState === "RUMBO_AL_PUERTO" &&
      operation.type !== "EXPORTACION" &&
      operation.type !== "EXPORTACION_ANTICIPADA") ||
    (nextState === undefined && operation.type === "IMPORTACION");

  return startsAtOrigin
    ? {
        value: operation.fechaCitaOrigen ?? operation.scheduledAt,
        label: "cita de origen",
      }
    : { value: operation.fechaCitaDestino, label: "cita de destino" };
}

export function getMissingMandatoryAppointments(
  operation: WorkflowGuardOperation,
  nextState?: string,
): string[] {
  const isLooseForeignTradeOperation =
    isLooseCargoOperation(operation) &&
    ["IMPORTACION", "EXPORTACION", "EXPORTACION_ANTICIPADA"].includes(
      operation.type ?? "",
    );
  if (isLooseForeignTradeOperation) {
    const appointment = getLooseCargoAppointment(operation, nextState);
    return appointment.value ? [] : [appointment.label];
  }

  if (!operation.scheduledAt) return ["programación"];

  switch (operation.type) {
    case "IMPORTACION":
      return operation.fechaCitaOrigen ? [] : ["cita de puerto"];
    case "EXPORTACION":
      if (operation.isAnticipada) {
        return operation.fechaCitaDestino ? [] : ["cita de puerto"];
      }
      if (
        !(operation.fechaCitaOrigen ?? operation.scheduledAt) &&
        !operation.fechaCitaDestino
      ) {
        return ["cita de patio", "cita de puerto"];
      }
      if (!(operation.fechaCitaOrigen ?? operation.scheduledAt)) {
        return ["cita de patio"];
      }
      if (!operation.fechaCitaDestino) return ["cita de puerto"];
      return [];
    case "EXPORTACION_ANTICIPADA":
      return operation.fechaCitaDestino ? [] : ["cita de puerto"];
    case "RETIRO_VACIO":
    case "DEVOLUCION_VACIO":
      return operation.fechaCitaOrigen || operation.fechaCitaDestino
        ? []
        : ["cita de patio"];
    default:
      return [];
  }
}

export function hasValidWorkflowEvidence(
  operation: WorkflowGuardOperation,
  types: readonly string[],
): boolean {
  return types.some((type) =>
    operation.evidences?.some(
      (evidence) =>
        evidence.type === type &&
        evidence.estadoRevision !== "DEVUELTO",
    ),
  );
}

export function getMissingExportCloseRequirements(
  operation: WorkflowGuardOperation,
): string[] {
  const missing: string[] = [];
  const closedPhotoTypes = [
    "FOTO_CARGUE",
    "LOADING_PHOTO_EVIDENCE",
    "SELLOS_CONTENEDOR",
    "SEAL_EVIDENCE",
  ];
  if (!hasValidWorkflowEvidence(operation, closedPhotoTypes)) {
    missing.push("foto del contenedor cerrado");
  }
  if (!operation.sealNumber?.trim()) missing.push("número de sello");
  if (operation.containerStatus !== "CARGADO") {
    missing.push("estado CARGADO");
  }
  return missing;
}

export function getMissingRetiroVacioClosingEvidence(
  operation: WorkflowGuardOperation,
): string[] {
  const closingTypes = [
    "DELIVERY_DOC",
    "SALIDA_PUERTO",
    "Soporte de cierre",
  ];
  return hasValidWorkflowEvidence(operation, closingTypes)
    ? []
    : ["soporte de entrega, salida de puerto o soporte de cierre"];
}
