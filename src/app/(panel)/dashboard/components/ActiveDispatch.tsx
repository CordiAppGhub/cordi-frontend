'use client';

import React, { useMemo, useState } from 'react';
import { ColumnDef } from '@/types/table';
import { Button } from '@/components/atoms/button/button';
import { StatusBadge } from '@/components/atoms/badge.tsx/badge';
import PaginationTable from '@/components/organisms/pagination-table/pagination-table';
import styles from '../dashboard.module.css';
import { ActiveDispatch } from '@/types/dashboard-types';
import { DashboardFilters } from '@/services/dashboard.service';
import { DashboardFiltersPanel } from './DashboardFiltersPanel';
import { useClients } from '@/hooks/useClient';

interface Props {
  dispatches: ActiveDispatch[];
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export const ActiveDispatchesTable: React.FC<Props> = ({ 
  dispatches, 
  filters, 
  onFiltersChange, 
  searchValue, 
  onSearchChange 
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const { clients, isLoadingClients } = useClients()


  const columns = useMemo<ColumnDef<ActiveDispatch>[]>(() => [
    { 
      id: 'vehiclePlate', 
      header: 'Placa', 
      type: 'text', 
      renderCell: (row) => <strong style={{ color: '#0f172a' }}>{row.vehiclePlate}</strong> 
    },
    { id: 'driverName', header: 'Conductor', type: 'text' },
    { 
      id: 'cliente', 
      header: 'Cliente / Ruta', 
      type: 'text', 
      renderCell: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: '#1e293b' }}>{row.cliente}</span>
          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{row.ultimaUbicacion}</span>
        </div>
      )
    },
    { 
      id: 'status', 
      header: 'Estado', 
      type: 'text', 
      renderCell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StatusBadge status={row.status} />
          {row.hasDesvios && <span title="Viaje con Desvíos" style={{ fontSize: '1.2rem' }}>⚠️</span>}
        </div>
      ) 
    },
    {
      id: 'actions',
      header: 'Acción Rápida',
      type: 'text',
      renderCell: (row) => (
        row.status === 'PAUSADA' ? (
          <Button style={{ padding: '6px 14px', fontSize: '0.8rem', background: '#dc2626' }}>Resolver Falla</Button>
        ) : (
          <Button style={{ padding: '6px 14px', fontSize: '0.8rem', background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0' }}>Ver Detalles</Button>
        )
      )
    }
  ], []);

  return (
    <div className={styles.tableSection}>
      <div className={styles.tableHeader}>
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: '700' }}>Flota Activa en Ruta</h3>
        
        <div className={styles.tableControls}>
          {/* El input ahora controla directamente el estado superior con debounce */}
          <input 
            type="text" 
            placeholder="🔍 Buscar placa o contenedor..." 
            className={styles.searchInput} 
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          
          <Button 
            variant="secondary" 
            style={{ 
              background: showFilters ? '#e2e8f0' : 'white', 
              color: '#0f172a', 
              border: '1px solid #cbd5e1' 
            }}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Ocultar Filtros' : 'Filtros Avanzados'}
          </Button>
        </div>
      </div>

      {showFilters && (
        <DashboardFiltersPanel 
          filters={filters}
          onChange={onFiltersChange}
          onClear={() => onFiltersChange({ search: filters.search })} 
          clients={clients}
          analysts={[]}
        />
      )}

      <PaginationTable
        data={dispatches}
        columns={columns}
        totalPages={1}
        currentPage={1}
        onPageChange={() => { }}
      />
    </div>
  );
};