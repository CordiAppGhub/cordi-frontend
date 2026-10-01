import { StatusBadge } from '@/components/atoms/badge.tsx/badge';
import { AffiliationTariff } from '@/types/tariff-ypes';

// Opcional: tipa los objetos como `any` de forma temporal en la estructura o asegúrate de importar el ColumnDef de tu tabla
export const getVehicleTariffColumns = (onEdit: (tariff: AffiliationTariff) => void) => [
  {
    id: 'affiliation',
    header: 'Tipo de Flota',
    type: 'text' as const, // 👈 Forzamos como literal para evitar choque de tipos
    renderCell: (row: AffiliationTariff) => <StatusBadge status={row.affiliation} />,
  },
  {
    id: 'percentage',
    header: 'Porcentaje Retención',
    type: 'text' as const,
    renderCell: (row: AffiliationTariff) => (
      <span style={{ color: '#b45309', fontWeight: 'bold' }}>
        {row.percentage}%
      </span>
    ),
  },
  {
    id: 'description',
    header: 'Descripción',
    type: 'text' as const,
    accessorKey: 'description',
  },
  {
    id: 'actions',
    header: 'Acciones',
    type: 'text' as const,
    renderCell: (row: AffiliationTariff) => (
      <button
        onClick={() => onEdit(row)}
        style={{
          background: 'none',
          border: 'none',
          color: '#2563eb',
          cursor: 'pointer',
          textDecoration: 'underline',
        }}
      >
        Editar
      </button>
    ),
  },
];