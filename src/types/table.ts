
export type ColumnType = 'text' | 'number' | 'select' | 'date';

export interface ColumnDef<T> {
  id: string;
  header: string;
  type?: ColumnType;
  editable?: boolean;
  options?: string[];

  renderCell?: (row: T) => React.ReactNode;
  isDraggable?: boolean; 
  
}