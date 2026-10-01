export const UserRoleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  JEFE_DE_FLOTA: 'Jefe de Flota',
  ANALISTA: 'Analista',
  CONDUCTOR: 'Conductor',
};

export const VehicleStatusLabels: Record<string, string> = {
  AVAILABLE: 'Disponible',
  IN_TRANSIT: 'En Tránsito',
  MAINTENANCE: 'En Mantenimiento',
  OUT_OF_SERVICE: 'Fuera de Servicio',
};

export const OperationStatusLabels: Record<string, string> = {
  CREADO: 'Creado',
  ASIGNADO: 'Asignado',
  EN_CURSO: 'En Curso',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
};

export const TripMicroStateLabels: Record<string, string> = {
  RUMBO_AL_PUERTO: 'Rumbo al Puerto',
  EN_PUERTO: 'En Puerto',
  EN_PUERTO_CARGADO: 'En Puerto (Cargado)',
  RUMBO_AL_CLIENTE: 'Rumbo al Cliente',
  EN_CLIENTE: 'En Cliente',
  FINALIZADO: 'Finalizado',
};

export const ContainerStatusLabels: Record<string, string> = {
  IN_YARD: 'En Patio',
  DISPATCHED: 'Despachado',
  MAINTENANCE: 'En Mantenimiento',
};

// 🚀 Definimos el tipo explícito para permitir el semáforo
export type StatusConfigType = {
  label: string;
  bg: string;
  color: string;
  border?: string;      // Opcional para semáforos
  dot?: string;         // Opcional para semáforos (Color del LED)
  description?: string; // Opcional para Tooltips
};

export const StatusConfig: Record<string, StatusConfigType> = {
  // ==========================================
  // 🚦 OPERACIONES (NUEVA SEMAFORIZACIÓN)
  // ==========================================
  CREADO: { 
    label: 'PENDIENTE', bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5', dot: '#ef4444',
    description: 'Estado Técnico: CREADO. Expo anticipadas, devoluciones o ingresos a cargue en piso (Contenedor pendiente de retirar o ingresar).'
  },
  ASIGNADO: { 
    label: 'PENDIENTE', bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5', dot: '#ef4444',
    description: 'Estado Técnico: ASIGNADO. Expo anticipadas, devoluciones o ingresos a cargue en piso (Contenedor pendiente de retirar o ingresar).'
  },
  EN_CURSO: { 
    label: 'EN PROCESO', bg: '#fffbeb', color: '#b45309', border: '#fcd34d', dot: '#f59e0b',
    description: 'Estado Técnico: EN_CURSO. Contenedor cargado en vehículo o descargando (IMPO, EXPO, Devoluciones, Puerto o Cliente).'
  },
  FINALIZADO: { 
    label: 'FINALIZADA', bg: '#f0fdf4', color: '#15803d', border: '#86efac', dot: '#22c55e',
    description: 'Estado Técnico: FINALIZADO. Contenedor en patio vacío o entregado exitosamente en puerto.'
  },
  PAUSADA: { 
    label: 'PAUSADA', bg: '#e2e8f0', color: '#334155', border: '#cbd5e1', dot: '#64748b',
    description: 'Estado Técnico: PAUSADA. Operación detenida temporalmente.'
  },
  CANCELADO: { 
    label: 'CANCELADO', bg: '#fee2e2', color: '#dc2626', border: '#fca5a5', dot: '#ef4444',
    description: 'Estado Técnico: CANCELADO. Operación anulada por el cliente.'
  },

  // ==========================================
  // 🏷️ MICROESTADOS DE VIAJE (Estilo Normal)
  // ==========================================
  RUMBO_AL_PUERTO: { label: 'Rumbo al Puerto', bg: '#e0f2fe', color: '#0369a1' },
  EN_PUERTO: { label: 'En Puerto', bg: '#fef3c7', color: '#b45309' },
  EN_PUERTO_CARGADO: { label: 'En Puerto (Cargado)', bg: '#f3e8ff', color: '#7e22ce' },
  RUMBO_AL_CLIENTE: { label: 'Rumbo al Cliente', bg: '#ccfbf1', color: '#0f766e' },
  EN_CLIENTE: { label: 'En Cliente', bg: '#ffedd5', color: '#c2410c' },

  // ==========================================
  // 🏷️ VEHÍCULOS (Estilo Normal)
  // ==========================================
  AVAILABLE: { label: 'Disponible', bg: '#dcfce7', color: '#15803d' },
  IN_TRANSIT: { label: 'En Tránsito', bg: '#e0f2fe', color: '#0369a1' },
  MAINTENANCE: { label: 'En Mantenimiento', bg: '#fef3c7', color: '#b45309' },
  OUT_OF_SERVICE: { label: 'Fuera de Servicio', bg: '#fee2e2', color: '#dc2626' },

  // ==========================================
  // 🏷️ CONTENEDORES (Estilo Normal)
  // ==========================================
  IN_YARD: { label: 'En Patio', bg: '#f1f5f9', color: '#475569' },
  DISPATCHED: { label: 'Despachado', bg: '#e0f2fe', color: '#0369a1' },
};