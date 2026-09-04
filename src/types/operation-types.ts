// 1. Interfaz para las evidencias fotográficas
export interface Evidence {
  id: number;
  url: string;
  type: string; // Ej: 'FOTO_PLACA', 'FOTO_CONTENEDOR', 'SOPORTE_ENTREGA'
  createdAt?: string;
}

// 2. Interfaz para el vehículo
export interface Vehicle {
  plate: string;
  status?: string;
}

// 3. Interfaz para los nodos logísticos (ya que tu backend los envía)
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
  
  vehicle?: Vehicle | null;
  evidences?: Evidence[];
  
  origen?: LogisticNode | null;
  cargue?: LogisticNode | null;
  descargue?: LogisticNode | null;
  destino?: LogisticNode | null;
}