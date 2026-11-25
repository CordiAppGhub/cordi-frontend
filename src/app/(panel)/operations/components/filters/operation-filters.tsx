'use client';

import React, { useState } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Select } from '@/components/atoms/select/select';
import { GetOperationsParams } from '@/services/operation.service';
import styles from './operation-filters.module.css';

interface OperationFiltersProps {
  onFilter: (filters: GetOperationsParams) => void;
  isLoading?: boolean;
}

export const OperationFilters: React.FC<OperationFiltersProps> = ({ onFilter, isLoading }) => {
  const [filters, setFilters] = useState<GetOperationsParams>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]:
        name === 'isContainerized'
          ? value === '' ? undefined : value === 'true'
          : value || undefined,
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter({ ...filters, page: 1 });
  };

  const handleClear = () => {
    setFilters({});
    onFilter({
      page: 1,
      limit: 10,
      search: undefined,
      isContainerized: undefined,
      date: undefined,
      conductor: undefined,
      status: undefined,
    });
  };

  return (
    <div className={styles.filterCard}>
      <form onSubmit={handleSearch}>
        <div className={styles.mainRow}>
          <label className={`${styles.inputGroup} ${styles.searchGroup}`}>
            <span className={styles.label}>Buscar</span>
            <input
              name="search"
              value={filters.search || ''}
              onChange={handleChange}
              placeholder="Placa / contenedor / # Op."
              className={styles.input}
            />
          </label>

          <label className={`${styles.inputGroup} ${styles.modalityGroup}`}>
            <span className={styles.label}>Modalidad</span>
            <Select
              name="isContainerized"
              value={
                filters.isContainerized === undefined
                  ? ''
                  : String(filters.isContainerized)
              }
              onChange={handleChange}
              className={styles.input}
            >
              <option value="">Todas</option>
              <option value="true">Contenerizada</option>
              <option value="false">Carga Suelta</option>
            </Select>
          </label>

          <label className={`${styles.inputGroup} ${styles.dateGroup}`}>
            <span className={styles.label}>Fecha prog.</span>
            <input
              name="date"
              type="date"
              value={filters.date || ''}
              onChange={handleChange}
              className={styles.input}
            />
          </label>

          <div className={styles.buttonsGroup}>
            <button type="submit" disabled={isLoading} className={styles.btnPrimary}>
              <Search size={14} /> {isLoading ? '...' : 'Buscar'}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className={styles.btnSecondary}
              title="Limpiar filtros"
              aria-label="Limpiar filtros"
            >
              <X size={15} />
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className={styles.btnSecondary}
              aria-expanded={isExpanded}
            >
              <Filter size={14} /> {isExpanded ? 'Menos filtros' : 'Más filtros'}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className={styles.advancedRow}>
            <label className={styles.inputGroup}>
              <span className={styles.label}>Conductor</span>
              <input name="conductor" value={filters.conductor || ''} onChange={handleChange} placeholder="Nombre..." className={styles.input} />
            </label>

            <label className={styles.inputGroup}>
              <span className={styles.label}>Estado</span>
              <Select name="status" value={filters.status || ''} onChange={handleChange} className={styles.input}>
                <option value="">Todos</option>
                <option value="CREADO">Creado</option>
                <option value="PENDIENTE_PROGRAMACION">Pendiente de programación</option>
                <option value="PROGRAMADA">Programada</option>
                <option value="PROGRAMADO">Programado</option>
                <option value="ASIGNADO">Asignado</option>
                <option value="EN_CURSO">En curso</option>
                <option value="CIERRE_FISICO">Cierre físico</option>
                <option value="PAUSADA">Pausada</option>
                <option value="DESVIO_REPORTADO">Desvío reportado</option>
              </Select>
            </label>
          </div>
        )}
      </form>
    </div>
  );
};
