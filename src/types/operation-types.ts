export interface Evidence {
  id: number;
  url: string;
  type: string;
  createdAt?: string;
}

// 2. Interfaz para el vehículo
export interface Vehicle {
  plate: string;
  status?: string;
}


export interface LogisticNode {
  name: string;
}

export interface UserDriver {
  id: number;
  name: string | null;
  chatId: string;
}

export interface Operation {
  id: number;
  type: string;
  status: 'CREADO' | 'ASIGNADO' | 'EN_CURSO' | 'FINALIZADO';
  containerNumber: string | null;
  driver?: UserDriver | null;
  estadoViaje?: string | null;
  scheduledAt?: string | null;
  
  vehicle?: Vehicle | null;
  evidences?: Evidence[];
  placaIA?: string | null;
  origen?: LogisticNode | null;
  cargue?: LogisticNode | null;
  descargue?: LogisticNode | null;
  destino?: LogisticNode | null;
}