import { ColumnDef } from '@/types/table';
import { Building2, User } from 'lucide-react';

// 🚀 Ahora recibe el rol del usuario como parámetro
export const getClientColumns = (userRole?: string): ColumnDef<any>[] => {
  const columns: ColumnDef<any>[] = [
    {
      id: 'clientName',
      header: 'Cliente',
      type: 'text',
      renderCell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={16} color="#2563eb" />
          <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{row.clientName}</strong>
        </div>
      )
    },
    {
      id: 'totalOperaciones',
      header: 'Total Operaciones',
      type: 'text',
      renderCell: (row) => (
        <span style={{ fontWeight: 600, color: '#475569' }}>
          {row.totalOperaciones} viaje(s)
        </span>
      )
    },
    {
      id: 'totalFacturacion',
      header: 'Facturación Estimada',
      type: 'text',
      renderCell: (row) => (
        <span style={{ fontWeight: 700, color: '#15803d' }}>
          ${row.totalFacturacion.toLocaleString('es-CO')}
        </span>
      )
    }
  ];

  // 🚀 LÓGICA CONDICIONAL: Si es Jefe o Admin, insertamos la columna del Analista en la posición 1 (después del cliente)
  if (userRole === 'JEFE_DE_FLOTA' || userRole === 'ADMIN') {
    columns.splice(1, 0, {
      id: 'analystName',
      header: 'Analista Responsable',
      type: 'text',
      renderCell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
          <User size={14} color="#64748b" />
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
            {row.analystName || 'Sin asignar'}
          </span>
        </div>
      )
    });
  }

  return columns;
};