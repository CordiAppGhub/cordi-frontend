import { StatusBadge } from '@/components/atoms/badge.tsx/badge';
import { AffiliationTariff } from '@/types/tariff-ypes';
import { Button } from '@/components/atoms/button/button';

export const getVehicleTariffColumns = (
  onEdit: (tariff: AffiliationTariff) => void,
  onDelete: (tariff: AffiliationTariff) => void,
) => [
  {
    id: 'affiliation',
    header: 'Tipo de Flota',
    type: 'text' as const, 
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <Button
          type="button"
          variant="secondary"
          onClick={(event) => {
            event.stopPropagation();
            onEdit(row);
          }}
        >
          Editar
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(row);
          }}
        >
          Eliminar
        </Button>
      </div>
    ),
  },
];