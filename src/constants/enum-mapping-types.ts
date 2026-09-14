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




export const StatusConfig: Record<string, { label: string; bg: string; color: string }> = {
  // Operaciones / Microestados
  ASIGNADO: { label: 'Asignado', bg: '#f1f5f9', color: '#475569' },
  RUMBO_AL_PUERTO: { label: 'Rumbo al Puerto', bg: '#e0f2fe', color: '#0369a1' },
  EN_PUERTO: { label: 'En Puerto', bg: '#fef3c7', color: '#b45309' },
  EN_PUERTO_CARGADO: { label: 'En Puerto (Cargado)', bg: '#f3e8ff', color: '#7e22ce' },
  RUMBO_AL_CLIENTE: { label: 'Rumbo al Cliente', bg: '#ccfbf1', color: '#0f766e' },
  EN_CLIENTE: { label: 'En Cliente', bg: '#ffedd5', color: '#c2410c' },
  FINALIZADO: { label: 'Finalizado', bg: '#dcfce7', color: '#15803d' },
  CANCELADO: { label: 'Cancelado', bg: '#fee2e2', color: '#dc2626' },

  // Vehículos
  AVAILABLE: { label: 'Disponible', bg: '#dcfce7', color: '#15803d' },
  IN_TRANSIT: { label: 'En Tránsito', bg: '#e0f2fe', color: '#0369a1' },
  MAINTENANCE: { label: 'En Mantenimiento', bg: '#fef3c7', color: '#b45309' },
  OUT_OF_SERVICE: { label: 'Fuera de Servicio', bg: '#fee2e2', color: '#dc2626' },

  // Contenedores
  IN_YARD: { label: 'En Patio', bg: '#f1f5f9', color: '#475569' },
  DISPATCHED: { label: 'Despachado', bg: '#e0f2fe', color: '#0369a1' },
};