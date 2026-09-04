// src/types/table.ts

export type ColumnType = 'text' | 'number' | 'select' | 'date';

export interface ColumnDef<T> {
  id: string; // El key exacto en tu objeto de datos (ej: 'plate', 'empresa')
  header: string; // El título visual (ej: 'Placa', 'Empresa Asignada')
  type: ColumnType;
  editable?: boolean;
  options?: string[]; // Solo usado si type === 'select'
  // Una función opcional para renderizar datos complejos (ej: objetos anidados como driver.name)
  renderCell?: (row: T) => React.ReactNode;
  isDraggable?: boolean; 
  
}