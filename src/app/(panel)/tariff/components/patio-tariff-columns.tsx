import { ColumnDef } from '@/types/table';
import { PatioTariff } from '@/types/tariff-ypes';

export const getPatioTariffColumns = (): ColumnDef<PatioTariff>[] => [
  {
    id: 'location',
    header: 'Patio',
    type: 'text',
    renderCell: (row) => <strong>{row.location?.name || 'No disponible'}</strong>,
  },
  {
    id: 'client',
    header: 'Cliente',
    type: 'text',
    renderCell: (row) => row.client?.razonSocial || 'No disponible',
  },
  {
    id: 'paymentPrice',
    header: 'Costo del patio (COP)',
    type: 'text',
    renderCell: (row) => `$${Number(row.paymentPrice).toLocaleString('es-CO')}`,
  },
  {
    id: 'billingPrice',
    header: 'Cobro al cliente (COP)',
    type: 'text',
    renderCell: (row) => (
      <strong style={{ color: '#15803d' }}>
        ${Number(row.billingPrice).toLocaleString('es-CO')}
      </strong>
    ),
  },
  {
    id: 'profit',
    header: 'Margen bruto (COP)',
    type: 'text',
    renderCell: (row) => {
      const margin = Number(row.billingPrice) - Number(row.paymentPrice);
      return (
        <strong style={{ color: margin >= 0 ? '#15803d' : '#dc2626' }}>
          ${margin.toLocaleString('es-CO')}
        </strong>
      );
    },
  },
];
