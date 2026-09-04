'use client';

import React, { useState } from 'react';
import { SLABadge } from '@/components/atoms/sla-badge/sla-badge';
import { YardContainer } from '@/types/yard-types';
import { Button } from '@/components/atoms/button/button';
import PaginationTable from '@/components/organisms/pagination-table/pagination-table';

const mockYardData: YardContainer[] = [
  { id: 1, containerNumber: 'MSKU1234567', type: 'Vacío Exportación', yard: 'TLA', entryDate: '2023-10-25', client: 'Gamalog', shippingCompany: 'Maersk', analyst: 'Carlos', status: 'En Patio', daysInYard: 5, slaStatus: 'rojo' },
  { id: 2, containerNumber: 'HLXU7654321', type: 'Vacío Importación', yard: 'Patio Nuevo Corditrans', entryDate: '2023-10-27', client: 'Supermastik', shippingCompany: 'Hapag-Lloyd', analyst: 'Ana', status: 'En Patio', daysInYard: 3, slaStatus: 'amarillo' },
  { id: 3, containerNumber: 'CMAU0001112', type: 'Vacío Exportación', yard: 'TLA', entryDate: '2023-10-29', client: 'Galvanized', shippingCompany: 'CMA CGM', analyst: 'Carlos', status: 'Programado para Cargue', daysInYard: 1, slaStatus: 'verde' },
];

export default function YardsPage() {
  const [containers] = useState<YardContainer[]>(mockYardData);

  // Columnas para la tabla reutilizable que ya creamos
  const columns = [
    { header: 'Contenedor', accessor: 'containerNumber' as keyof YardContainer },
    { header: 'Patio', accessor: 'yard' as keyof YardContainer },
    { header: 'Cliente', accessor: 'client' as keyof YardContainer },
    { header: 'Naviera', accessor: 'shippingCompany' as keyof YardContainer },
    { header: 'Estado', accessor: 'status' as keyof YardContainer },
    { 
      header: 'Semáforo (SLA)', 
      accessor: (row: YardContainer) => (
        <SLABadge status={row.slaStatus} days={row.daysInYard} />
      ) 
    },
    { 
      header: 'Acción Requerida', 
      accessor: (row: YardContainer) => (
        <Button variant={row.slaStatus === 'rojo' ? 'primary' : 'secondary'}>
          {row.slaStatus === 'rojo' ? 'Gestionar Urgente' : 'Ver Detalle'}
        </Button>
      ) 
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Control Inteligente de Patios</h1>
        <Button>+ Registrar Ingreso a Patio</Button>
      </div>

      {/* Indicadores Globales (Resumen Ejecutivo) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '14px', color: '#64748b' }}>Total en Patios</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>{containers.length}</p>
        </div>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '14px', color: '#64748b' }}>Alertas Rojas</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>
            {containers.filter(c => c.slaStatus === 'rojo').length}
          </p>
        </div>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '14px', color: '#64748b' }}>Permanencia Promedio</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>3 Días</p>
        </div>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '14px', color: '#64748b' }}>Pendientes de Devolución</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>
            {containers.filter(c => c.type === 'Vacío Importación').length}
          </p>
        </div>
      </div>
      
      {/* Tabla ordenada por el SLA */}
      <PaginationTable data={containers} columns={columns} pageSize={10} />
    </div>
  );
}