export const UserRoleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  JEFE_DE_FLOTA: "Jefe de Flota",
  ANALISTA: "Analista",
  CONDUCTOR: "Conductor",
};

export const VehicleStatusLabels: Record<string, string> = {
  AVAILABLE: "Disponible",
  IN_TRANSIT: "En Tránsito",
  MAINTENANCE: "En Mantenimiento",
  OUT_OF_SERVICE: "Fuera de Servicio",
};

export const OperationStatusLabels: Record<string, string> = {
  CREADO: "Creado",
  PENDIENTE_PROGRAMACION: "Pendiente de programación",
  PROGRAMADA: "Programada",
  PENDIENTE_CARGUE: "Pendiente de cargue",
  LISTA_PARA_CARGUE: "Lista para cargue",
  ASIGNADO: "Asignado",
  EN_CURSO: "En Curso",
  CIERRE_FISICO: "Cierre físico pendiente de revisión documental",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
};

export const TripMicroStateLabels: Record<string, string> = {
  RUMBO_AL_PUERTO: "Rumbo al Puerto",
  EN_PUERTO: "En Puerto",
  EN_PUERTO_CARGADO: "En Puerto (Cargado)",
  RUMBO_AL_CLIENTE: "Rumbo al Cliente",
  EN_CLIENTE: "En Cliente",
  FINALIZADO: "Finalizado",
};

export const ContainerStatusLabels: Record<string, string> = {
  PENDIENTE: "Pendiente",
  PENDIENTE_CARGUE: "Pendiente de cargue",
  RESERVADO_ANTICIPADO: "Reservado por retiro anticipado",
  VACIO: "Vacío",
  EN_PISO: "En piso",
  PENDIENTE_DEVOLUCION: "Pendiente de devolución",
  EN_INSPECCION: "En inspección",
  FALLA_REPORTADA: "Falla reportada",
  CARGANDO_AL_TRAILER: "Cargando al tráiler",
  CARGADO_AL_TRAILER: "Cargado al tráiler",
  EN_CARGUE: "En cargue",
  CARGADO: "Cargado",
  EN_DESCARGUE: "En descargue",
  DESCARGADO: "Descargado",
  DESMONTANDO_DEL_TRAILER: "Desmontando del tráiler",
  DESMONTADO_DEL_TRAILER: "Desmontado del tráiler",
  ENTREGADO: "Entregado",
  DEVUELTO_VACIO: "Devuelto vacío",
};

// 🚀 Definimos el tipo explícito para permitir el semáforo
export type StatusConfigType = {
  label: string;
  bg: string;
  color: string;
  border?: string;
  dot?: string;
  description?: string;
};

export const StatusConfig: Record<string, StatusConfigType> = {
  PENDIENTE_PROGRAMACION: {
    label: "PENDIENTE DE PROGRAMACIÓN",
    bg: "#fef3c7",
    color: "#92400e",
    border: "#fcd34d",
    dot: "#f59e0b",
    description: "La operación espera programación y/o citas obligatorias.",
  },
  PROGRAMADA: {
    label: "PROGRAMADA",
    bg: "#eff6fe",
    color: "#1d4ed8",
    border: "#93c5fd",
    dot: "#3b82f6",
    description: "La operación tiene programación y citas obligatorias completas.",
  },
  CREADO: {
    label: "PENDIENTE",
    bg: "#fef2f2",
    color: "#b91c1c",
    border: "#fca5a5",
    dot: "#ef4444",
    description:
      "Estado Técnico: CREADO. Expo anticipadas, devoluciones o ingresos a cargue en piso (Contenedor pendiente de retirar o ingresar).",
  },
  ASIGNADO: {
    label: "PENDIENTE",
    bg: "#fef2f2",
    color: "#b91c1c",
    border: "#fca5a5",
    dot: "#ef4444",
    description:
      "Estado Técnico: ASIGNADO. Expo anticipadas, devoluciones o ingresos a cargue en piso (Contenedor pendiente de retirar o ingresar).",
  },
  PROGRAMADO: {
    label: "PROGRAMADO",
    bg: "#eff6ff",
    color: "#1d4ed8",
    border: "#93c5fd",
    dot: "#3b82f6",
    description: "Estado Técnico: PROGRAMADO. Operación con cita programada.",
  },
  PENDIENTE_CARGUE: {
    label: "PENDIENTE DE CARGUE",
    bg: "#fff7ed",
    color: "#c2410c",
    border: "#fdba74",
    dot: "#f97316",
    description:
      "La exportación está esperando que se complete el retiro anticipado del contenedor vacío.",
  },
  LISTA_PARA_CARGUE: {
    label: "LISTA PARA CARGUE",
    bg: "#dcfce7",
    color: "#15803d",
    border: "#86efac",
    dot: "#22c55e",
    description:
      "El contenedor vacío ya fue entregado y la exportación puede asignarse para iniciar el cargue.",
  },
  PENDIENTE: {
    label: "PENDIENTE",
    bg: "#fef2f2",
    color: "#b91c1c",
    border: "#fca5a5",
    dot: "#ef4444",
    description: "Estado Técnico: PENDIENTE. Operación por iniciar.",
  },
  EN_CURSO: {
    label: "EN PROCESO",
    bg: "#fffbeb",
    color: "#b45309",
    border: "#fcd34d",
    dot: "#f59e0b",
    description:
      "Estado Técnico: EN_CURSO. Contenedor cargado en vehículo o descargando (IMPO, EXPO, Devoluciones, Puerto o Cliente).",
  },
  CIERRE_FISICO: {
    label: "CIERRE FÍSICO",
    bg: "#fff7ed",
    color: "#c2410c",
    border: "#fdba74",
    dot: "#f97316",
    description:
      "El conductor terminó el trabajo en campo; el cierre documental está pendiente de aprobación.",
  },
  FINALIZADO: {
    label: "FINALIZADA",
    bg: "#f0fdf4",
    color: "#15803d",
    border: "#86efac",
    dot: "#22c55e",
    description:
      "Estado Técnico: FINALIZADO. Cierre físico y documental aprobados.",
  },
  PAUSADA: {
    label: "PAUSADA",
    bg: "#e2e8f0",
    color: "#334155",
    border: "#cbd5e1",
    dot: "#64748b",
    description: "Estado Técnico: PAUSADA. Operación detenida temporalmente.",
  },
  CANCELADO: {
    label: "CANCELADO",
    bg: "#fee2e2",
    color: "#dc2626",
    border: "#fca5a5",
    dot: "#ef4444",
    description: "Estado Técnico: CANCELADO. Operación anulada por el cliente.",
  },

  RUMBO_AL_PUERTO: {
    label: "Rumbo al Puerto",
    bg: "#e0f2fe",
    color: "#0369a1",
  },
  EN_PUERTO: { label: "En Puerto", bg: "#fef3c7", color: "#b45309" },
  EN_PUERTO_CARGADO: {
    label: "En Puerto (Cargado)",
    bg: "#f3e8ff",
    color: "#7e22ce",
  },
  RUMBO_AL_CLIENTE: {
    label: "Rumbo al Cliente",
    bg: "#ccfbf1",
    color: "#0f766e",
  },
  EN_CLIENTE: { label: "En Cliente", bg: "#ffedd5", color: "#c2410c" },
  CARGANDO_AL_TRAILER: {
    label: "Cargando al tráiler",
    bg: "#dbeafe",
    color: "#1d4ed8",
  },
  CARGADO_AL_TRAILER: {
    label: "Cargado al tráiler",
    bg: "#dcfce7",
    color: "#15803d",
  },
  DESMONTANDO_DEL_TRAILER: {
    label: "Desmontando del tráiler",
    bg: "#fef3c7",
    color: "#b45309",
  },
  DESMONTADO_DEL_TRAILER: {
    label: "Desmontado del tráiler",
    bg: "#e2e8f0",
    color: "#334155",
  },

  AVAILABLE: { label: "Disponible", bg: "#dcfce7", color: "#15803d" },
  IN_TRANSIT: { label: "En Tránsito", bg: "#e0f2fe", color: "#0369a1" },
  MAINTENANCE: { label: "En Mantenimiento", bg: "#fef3c7", color: "#b45309" },
  OUT_OF_SERVICE: {
    label: "Fuera de Servicio",
    bg: "#fee2e2",
    color: "#dc2626",
  },

  IN_YARD: { label: "En Patio", bg: "#f1f5f9", color: "#475569" },
  DISPATCHED: { label: "Despachado", bg: "#e0f2fe", color: "#0369a1" },
  AVAILABLE_IN_YARD: {
    label: "Disponible en patio",
    bg: "#dcfce7",
    color: "#15803d",
  },
  RESERVED_FOR_BOOKING: {
    label: "Reservado para exportación",
    bg: "#f3e8ff",
    color: "#7e22ce",
  },
};
