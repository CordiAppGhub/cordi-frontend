'use client';

import React from 'react';
import { ColumnDef } from '@/types/table';
import { formatLocationLabel } from '@/utils/location';
import { ClientTariff } from '@/types/tariff-ypes';
import { Button } from '@/components/atoms/button/button';

export interface ClientTariffGroup {
  id: number;
  clientName: string;
  tariffs: ClientTariff[];
}

export const groupTariffsByClient = (tariffs: ClientTariff[]): ClientTariffGroup[] => {
  const groups = new Map<number, ClientTariffGroup>();
  for (const tariff of tariffs) {
    const group = groups.get(tariff.clientId) ?? {
      id: tariff.clientId,
      clientName: tariff.client?.razonSocial || 'Desconocido',
      tariffs: [],
    };
    group.tariffs.push(tariff);
    groups.set(tariff.clientId, group);
  }
  return [...groups.values()].sort((a, b) => a.clientName.localeCompare(b.clientName));
};

export const getClientGroupColumns = (): ColumnDef<ClientTariffGroup>[] => [
  {
    id: 'client',
    header: 'Cliente Titular',
    type: 'text',
    renderCell: (row) => <strong style={{ color: '#0f172a' }}>{row.clientName}</strong>,
  },
  {
    id: 'count',
    header: 'Tarifas Configuradas',
    type: 'text',
    renderCell: (row) => (
      <span style={{ padding: '4px 8px', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
        {row.tariffs.length} {row.tariffs.length === 1 ? 'tarifa' : 'tarifas'}
      </span>
    ),
  },
];

export const getTariffColumns = (
  onEdit: (tariff: ClientTariff) => void,
): ColumnDef<ClientTariff>[] =>
  getClientTariffColumns(onEdit).filter((column) => column.id !== 'client');

const getClientTariffColumns = (
  onEdit: (tariff: ClientTariff) => void,
): ColumnDef<ClientTariff>[] => [
  {
    id: 'client',
    header: 'Cliente Titular',
    type: 'text',
    renderCell: (row) => (
      <strong style={{ color: '#0f172a' }}>
        {row.client?.razonSocial || 'Desconocido'}
      </strong>
    ),
  },
  {
    id: 'operationType',
    header: 'Tipo Operación',
    type: 'text',
    renderCell: (row) => (
      <span style={{ 
        padding: '4px 8px', 
        backgroundColor: '#e0f2fe', 
        color: '#0369a1', 
        borderRadius: '12px', 
        fontSize: '0.8rem', 
        fontWeight: 600 
      }}>
        {row.operationType}
      </span>
    ),
  },
  {
    id: 'isAnticipada',
    header: 'Modalidad',
    type: 'text',
    renderCell: (row) => (
      row.isAnticipada ? (
        <span style={{ color: '#ea580c', fontWeight: 600 }}>Anticipado</span>
      ) : (
        <span style={{ color: '#16a34a', fontWeight: 600 }}>Directo</span>
      )
    ),
  },
  {
    id: 'cargoFormat',
    header: 'Formato / Capacidad',
    type: 'text',
    renderCell: (row) => (
      <span>
        {row.cargoFormat === 'SUELTA'
          ? `Suelta · ${row.vehicleType?.name ?? 'Capacidad pendiente'}`
          : `Contenerizada · ${row.containerSize ?? 'Tamaño pendiente'}`}
      </span>
    ),
  },
  {
    id: 'route',
    header: 'Ruta',
    type: 'text',
    renderCell: (row) => {
      if (row.originLocation && row.destinationLocation) {
        return (
          <span style={{ fontSize: '0.85rem' }}>
            {formatLocationLabel(row.originLocation)} → {formatLocationLabel(row.destinationLocation)}
          </span>
        );
      }
      return (
        <span style={{
          padding: '4px 8px',
          backgroundColor: '#fef3c7',
          color: '#92400e',
          borderRadius: '12px',
          fontSize: '0.8rem',
        }}>
          Ruta pendiente de configurar
        </span>
      );
    },
  },
  {
    id: 'price',
    header: 'Precio Facturación (COP)',
    type: 'text',
    renderCell: (row) => (
      <strong style={{ color: '#16a34a', fontSize: '1.1rem' }}>
        ${row.price.toLocaleString('es-CO')}
      </strong>
    ),
  },
  {
    id: 'actions',
    header: 'Acciones',
    type: 'text',
    renderCell: (row) => (
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
    ),
  },
];