import { api } from "@/services/api.service";

export type NovedadCategory =
  | "ENFERMEDAD"
  | "CITA_MEDICA"
  | "PERMISO_PERSONAL"
  | "ACCIDENTE"
  | "FALLA_MECANICA"
  | "MANTENIMIENTO"
  | "DOCUMENTOS"
  | "OTRO"
  | "VACACIONES_PROGRAMADAS"
  | "CALAMIDAD_DOMESTICA"
  | "AUSENTISMO_INJUSTIFICADO"
  | "MANTENIMIENTO_PREVENTIVO"
  | "SINIESTRO_ACCIDENTE"
  | "BLOQUEO_DOCUMENTOS"
  | "PROBLEMAS_ORDEN_PUBLICO"
  | "FACTORES_CLIMATICOS"
  | "LLEGADA_TARDIA"
  | "PERDIDA_COMUNICACION"
  | "FALTA_ANTICIPOS"
  | "DOCUMENTACION_VIAJE_INCOMPLETA"
  | "ERROR_PROGRAMACION";

export const NOVEDAD_CATEGORY_LABELS: Record<NovedadCategory, string> = {
  ENFERMEDAD: "Incapacidad médica / enfermedad",
  CITA_MEDICA: "Cita médica",
  PERMISO_PERSONAL: "Permiso personal",
  ACCIDENTE: "Accidente",
  FALLA_MECANICA: "Falla mecánica (varada)",
  MANTENIMIENTO: "Mantenimiento",
  DOCUMENTOS: "Documentos",
  OTRO: "Otro",
  VACACIONES_PROGRAMADAS: "Vacaciones programadas",
  CALAMIDAD_DOMESTICA: "Calamidad doméstica",
  AUSENTISMO_INJUSTIFICADO: "Ausentismo injustificado",
  MANTENIMIENTO_PREVENTIVO: "Mantenimiento preventivo",
  SINIESTRO_ACCIDENTE: "Siniestro / accidente de tránsito",
  BLOQUEO_DOCUMENTOS: "Bloqueo por documentos",
  PROBLEMAS_ORDEN_PUBLICO: "Problemas de orden público",
  FACTORES_CLIMATICOS: "Factores climáticos",
  LLEGADA_TARDIA: "Llegada tardía",
  PERDIDA_COMUNICACION: "Pérdida de comunicación",
  FALTA_ANTICIPOS: "Falta de anticipos",
  DOCUMENTACION_VIAJE_INCOMPLETA: "Documentación de viaje incompleta",
  ERROR_PROGRAMACION: "Error de programación",
};

export type NovedadTarget = "DRIVER" | "VEHICLE" | "OPERATION" | "ANALYST";

export const CATEGORIES_BY_TARGET: Record<NovedadTarget, NovedadCategory[]> = {
  DRIVER: [
    "ENFERMEDAD",
    "CITA_MEDICA",
    "PERMISO_PERSONAL",
    "VACACIONES_PROGRAMADAS",
    "CALAMIDAD_DOMESTICA",
    "AUSENTISMO_INJUSTIFICADO",
    "ACCIDENTE",
    "DOCUMENTOS",
    "OTRO",
  ],
  VEHICLE: [
    "FALLA_MECANICA",
    "MANTENIMIENTO",
    "MANTENIMIENTO_PREVENTIVO",
    "SINIESTRO_ACCIDENTE",
    "BLOQUEO_DOCUMENTOS",
    "ACCIDENTE",
    "DOCUMENTOS",
    "OTRO",
  ],
  OPERATION: [
    "PROBLEMAS_ORDEN_PUBLICO",
    "FACTORES_CLIMATICOS",
    "LLEGADA_TARDIA",
    "PERDIDA_COMUNICACION",
    "FALTA_ANTICIPOS",
    "DOCUMENTACION_VIAJE_INCOMPLETA",
    "ERROR_PROGRAMACION",
    "ACCIDENTE",
    "DOCUMENTOS",
    "OTRO",
  ],
  ANALYST: [
    "ENFERMEDAD",
    "CITA_MEDICA",
    "PERMISO_PERSONAL",
    "VACACIONES_PROGRAMADAS",
    "CALAMIDAD_DOMESTICA",
    "AUSENTISMO_INJUSTIFICADO",
    "OTRO",
  ],
};

export const BLOCKING_CATEGORIES: Record<"DRIVER" | "VEHICLE", NovedadCategory[]> = {
  DRIVER: [
    "ENFERMEDAD",
    "CITA_MEDICA",
    "PERMISO_PERSONAL",
    "VACACIONES_PROGRAMADAS",
    "CALAMIDAD_DOMESTICA",
    "AUSENTISMO_INJUSTIFICADO",
    "ACCIDENTE",
  ],
  VEHICLE: [
    "FALLA_MECANICA",
    "MANTENIMIENTO",
    "MANTENIMIENTO_PREVENTIVO",
    "SINIESTRO_ACCIDENTE",
    "BLOQUEO_DOCUMENTOS",
    "ACCIDENTE",
  ],
};

export interface MyNovedadesResponse {
  isAvailable: boolean;
  blockingNovedad: NovedadItem | null;
  novedades: NovedadItem[];
}

export interface NovedadItem {
  id: number;
  category?: NovedadCategory | null;
  blocksAvailability?: boolean;
  expectedReturnAt?: string | null;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "PENDING" | "IN_REVIEW" | "RESOLVED";
  target: NovedadTarget;
  resolutionNotes?: string;
  createdAt: string;
  operationId?: number | null;
  metadata?: {
    comodatoOcr?: {
      legible: boolean;
      destino: string | null;
      fechaCita: string | null;
      numeroContenedor: string | null;
      referencia: string | null;
    };
  } | null;
  reportedBy: { name: string; role: string };
  resolvedBy?: { name: string };
  vehicle?: { plate: string };
  driver?: { name: string };
  analyst?: { id: number; name: string | null };
  analystDelegations?: Array<{
    id: number;
    delegateAnalyst: { id: number; name: string | null };
  }>;
  operation?: {
    id: number;
    type: string;
    status: string;
    containerStatus?: string;
    containerType?: string | null;
    origen?: { name: string };
    destino?: { id: number; name: string } | null;
    nuevoDestino?: { id: number; name: string } | null;
    nuevoDestinoId?: number | null;
    fechaCitaDesvio?: string | null;
    evidences?: Array<{
      id: number;
      type: string;
      url: string | null;
      createdAt: string;
    }>;
  };
}

export const novedadesService = {
  getAll: async (status?: string, target?: string): Promise<NovedadItem[]> => {
    const params = {
      ...(status && status !== "TODAS" ? { status } : {}),
      ...(target && target !== "TODAS" ? { target } : {}),
    };
    const res = await api.get("/novedades", { params });
    return res.data;
  },

  create: async (data: {
    description: string;
    severity: string;
    target: NovedadTarget;
    operationId?: number;
    vehicleId?: number;
    driverId?: number;
    category: NovedadCategory;
    analystId?: number;
    expectedReturnAt?: string;
  }) => {
    const res = await api.post("/novedades", data);
    return res.data;
  },

  resolve: async (id: number, resolutionNotes: string) => {
    const res = await api.patch(`/novedades/${id}/resolve`, {
      resolutionNotes,
    });
    return res.data;
  },
  markInReview: async (id: number) => {
    const res = await api.patch(`/novedades/${id}/review`);
    return res.data;
  },
};
