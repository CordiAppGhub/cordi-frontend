// src/components/organisms/dashboard-filters/DashboardFiltersPanel.tsx
'use client';

import React from 'react';
import { Select } from '@/components/atoms/select/select';
import { Input } from '@/components/atoms/input/input';
import { Button } from '@/components/atoms/button/button';
import { DashboardFilters } from '@/services/dashboard.service';
import styles from './DashboardFiltersPanel.module.css';

interface ClientOption {
  id: number;
  razonSocial: string;
}

interface AnalystOption {
  id: number;
  name: string;
}

interface Props {
  filters: DashboardFilters;
  onChange: (newFilters: DashboardFilters) => void;
  onClear: () => void;
  clients?: ClientOption[];
  analysts?: AnalystOption[];
}

export const DashboardFiltersPanel: React.FC<Props> = ({ 
  filters, 
  onChange, 
  onClear,
  clients = [],
  analysts = []
}) => {
  
  const handleChange = (field: keyof DashboardFilters, value: any) => {
    onChange({ ...filters, [field]: value });
  };

  return (
    <div className={styles.filtersPanel}>
      <div className={styles.filtersGrid}>
        
        {/* Filtro por Cliente */}
        <div className={styles.filterField}>
          <label className={styles.filterLabel}>Cliente</label>
          <Select
            value={filters.clientId ? String(filters.clientId) : ''}
            onChange={(e) => handleChange('clientId', e.target.value ? Number(e.target.value) : undefined)}
            options={[
              { value: '', label: 'Cliente: todos' },
              ...clients.map(c => ({ value: String(c.id), label: c.razonSocial }))
            ]}
          />
        </div>

        {/* Estado Operativo */}
        <div className={styles.filterField}>
          <label className={styles.filterLabel}>Estado Operativo</label>
          <Select
            value={filters.status || ''}
            onChange={(e) => handleChange('status', e.target.value || undefined)}
            options={[
              { value: '', label: 'Estado: todos' },
              { value: 'CREADO', label: 'Creado (Sin asignar)' },
              { value: 'ASIGNADO', label: 'Asignado (En espera)' },
              { value: 'EN_CURSO', label: 'En Curso (Rodando)' },
              { value: 'PAUSADA', label: 'Pausada (Con novedad)' },
              { value: 'FINALIZADO', label: 'Finalizado' },
            ]}
          />
        </div>

        {/* Tipo de Operación */}
        <div className={styles.filterField}>
          <label className={styles.filterLabel}>Tipo</label>
          <Select
            value={filters.type || ''}
            onChange={(e) => handleChange('type', e.target.value || undefined)}
            options={[
              { value: '', label: 'Tipo: todos' },
              { value: 'IMPORTACION', label: 'Importación' },
              { value: 'EXPORTACION', label: 'Exportación' },
              { value: 'RETIRO_VACIO', label: 'Retiro Vacío' },
              { value: 'DEVOLUCION', label: 'Devolución' },
            ]}
          />
        </div>

        {/* Analista */}
        <div className={styles.filterField}>
          <label className={styles.filterLabel}>Analista</label>
          <Select
            value={filters.analystId ? String(filters.analystId) : ''}
            onChange={(e) => handleChange('analystId', e.target.value ? Number(e.target.value) : undefined)}
            options={[
              { value: '', label: 'Analista: todos' },
              ...analysts.map(a => ({ value: String(a.id), label: a.name || 'Sin nombre' }))
            ]}
          />
        </div>

        {/* Fecha Desde */}
        <div className={styles.filterField}>
          <label className={styles.filterLabel}>Desde (Creación)</label>
          <Input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => handleChange('startDate', e.target.value || undefined)}
          />
        </div>

        {/* Fecha Hasta */}
        <div className={styles.filterField}>
          <label className={styles.filterLabel}>Hasta</label>
          <Input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => handleChange('endDate', e.target.value || undefined)}
          />
        </div>

        {/* Checkboxes */}
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              className={styles.checkboxInput}
              checked={!!filters.onlyMyOperations} 
              onChange={(e) => handleChange('onlyMyOperations', e.target.checked)} 
            />
            Solo mis operaciones
          </label>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              className={styles.checkboxInput}
              checked={!!filters.hasDeviations} 
              onChange={(e) => handleChange('hasDeviations', e.target.checked)} 
            />
            Con desvíos activos
          </label>
        </div>

        {/* Botón Limpiar */}
        <div className={styles.clearButtonWrapper}>
          <Button 
            variant="secondary" 
            onClick={onClear} 
            style={{ width: '100%', border: '1px solid #cbd5e1', color: '#475569' }}
          >
            Limpiar Filtros
          </Button>
        </div>

      </div>
    </div>
  );
};