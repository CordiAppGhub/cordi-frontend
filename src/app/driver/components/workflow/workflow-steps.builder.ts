export type WorkflowFamily =
  | "STANDARD"
  | "IMPORT_TO_YARD"
  | "IMPORT_TO_FLOOR"
  | "AMPARADO_IMPORT"
  | "AMPARADO_IMPORT_FLOOR"
  | "PENDING_RETURN"
  | "EXPORT"
  | "AMPARADO_EXPORT"
  | "EMPTY_PICKUP"
  | "EMPTY_PICKUP_TO_PORT"
  | "EMPTY_RETURN"
  | "EMPTY_RETURN_FROM_PORT"
  | "INTERNAL_MOVEMENT"
  | "LOOSE_CARGO";

export interface WorkflowBuilderOperation {
  type?: string;
  isAnticipada?: boolean;
  isContainerized?: boolean;
  cargoType?: string | null;
  tipoCarga?: string | null;
  isAmparado?: boolean;
  containerStatus?: string | null;
  origen?: { isPort?: boolean } | null;
  destino?: { isPort?: boolean } | null;
}

export interface WorkflowStepRegistry<TStep> {
  standard: TStep[];
  importToYard: TStep[];
  importToFloor: TStep[];
  amparadoImport: TStep[];
  amparadoImportFloor: TStep[];
  pendingReturn: TStep[];
  export: TStep[];
  amparadoExport: TStep[];
  emptyPickup: TStep[];
  emptyPickupToPort: TStep[];
  emptyReturn: TStep[];
  emptyReturnFromPort: TStep[];
  internalMovement: TStep[];
  looseCargo: TStep[];
}

export function getWorkflowFamily(
  operation: WorkflowBuilderOperation,
): WorkflowFamily {
  if (operation.type === "MOVIMIENTO_INTERNO") {
    return "INTERNAL_MOVEMENT";
  }
  if (
    operation.isContainerized !== true ||
    operation.cargoType === "LOOSE_CARGO" ||
    operation.tipoCarga === "SUELTA"
  ) {
    return "LOOSE_CARGO";
  }

  switch (operation.type) {
    case "IMPORTACION":
      if (operation.containerStatus === "PENDIENTE_DEVOLUCION") {
        return "PENDING_RETURN";
      }
      if (operation.isAmparado) {
        return operation.containerStatus === "EN_PISO"
          ? "AMPARADO_IMPORT_FLOOR"
          : "AMPARADO_IMPORT";
      }
      return operation.containerStatus === "EN_PISO"
        ? "IMPORT_TO_FLOOR"
        : "IMPORT_TO_YARD";
    case "EXPORTACION":
    case "EXPORTACION_ANTICIPADA":
      return operation.isAmparado ? "AMPARADO_EXPORT" : "EXPORT";
    case "RETIRO_VACIO":
      return operation.destino?.isPort
        ? "EMPTY_PICKUP_TO_PORT"
        : "EMPTY_PICKUP";
    case "DEVOLUCION_VACIO":
      return operation.origen?.isPort
        ? "EMPTY_RETURN_FROM_PORT"
        : "EMPTY_RETURN";
    case "MOVIMIENTO_INTERNO":
      return "INTERNAL_MOVEMENT";
    default:
      return "STANDARD";
  }
}

export function buildWorkflowSteps<TStep>(
  operation: WorkflowBuilderOperation,
  registry: WorkflowStepRegistry<TStep>,
): TStep[] {
  const family = getWorkflowFamily(operation);
  switch (family) {
    case "IMPORT_TO_YARD":
      return registry.importToYard;
    case "IMPORT_TO_FLOOR":
      return registry.importToFloor;
    case "AMPARADO_IMPORT":
      return registry.amparadoImport;
    case "AMPARADO_IMPORT_FLOOR":
      return registry.amparadoImportFloor;
    case "PENDING_RETURN":
      return registry.pendingReturn;
    case "EXPORT":
      return registry.export;
    case "AMPARADO_EXPORT":
      return registry.amparadoExport;
    case "EMPTY_PICKUP":
      return registry.emptyPickup;
    case "EMPTY_PICKUP_TO_PORT":
      return registry.emptyPickupToPort;
    case "EMPTY_RETURN":
      return registry.emptyReturn;
    case "EMPTY_RETURN_FROM_PORT":
      return registry.emptyReturnFromPort;
    case "INTERNAL_MOVEMENT":
      return registry.internalMovement;
    case "LOOSE_CARGO":
      return registry.looseCargo;
    default:
      return registry.standard;
  }
}
