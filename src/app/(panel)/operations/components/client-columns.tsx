import { ColumnDef } from '@/types/table';
import { OperationsClientGroup } from '@/types/operation-types';
import { Building2 } from 'lucide-react';

export const getClientColumns = (): ColumnDef<OperationsClientGroup>[] => {
  const columns: ColumnDef<OperationsClientGroup>[] = [
    {
      id: 'clientName',
      header: 'Cliente',
      type: 'text',
      renderCell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={14} color="#2563eb" />
          <strong style={{ color: '#0f172a' }}>{row.clientName}</strong>
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
  ];

  return columns;
};