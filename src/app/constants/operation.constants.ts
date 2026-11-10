import { OperationType } from "@/types/tariff-ypes";

export const operationOptions: Array<{ value: OperationType; label: string }> = [
  { value: "EXPORTACION", label: "Exportación" },
  { value: "IMPORTACION", label: "Importación" },
  { value: "RETIRO_VACIO", label: "Retiro de Vacío" },
  { value: "DEVOLUCION_VACIO", label: "Devolución de Vacío" },
  { value: "MOVIMIENTO_INTERNO", label: "Movimiento Interno" },
];