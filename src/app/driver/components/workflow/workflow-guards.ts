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

export function getMissingMandatoryAppointments(
  operation: WorkflowGuardOperation,
): string[] {
  if (!operation.scheduledAt) return ["programación"];

  switch (operation.type) {
    case "IMPORTACION":
      return operation.fechaCitaOrigen ? [] : ["cita de puerto"];
    case "EXPORTACION":
      if (operation.isAnticipada) {
        return operation.fechaCitaDestino ? [] : ["cita de puerto"];
      }
      if (!operation.fechaCitaOrigen && !operation.fechaCitaDestino) {
        return ["cita de patio", "cita de puerto"];
      }
      if (!operation.fechaCitaOrigen) return ["cita de patio"];
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
