'use client';

import React, { useState } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { GetOperationsParams } from '@/services/operation.service';
import styles from './OperationFilters.module.css';

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
      [name]: value || undefined,
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter({ ...filters, page: 1 });
  };

  const handleClear = () => {
    setFilters({});
    onFilter({ page: 1, limit: 10 });
  };

  return (
    <div className={styles.filterCard}>
      <form onSubmit={handleSearch}>
        
        {/* FILA PRINCIPAL: Compacta y en una sola línea */}
        <div className={styles.mainRow}>
          <div className={styles.inputGroup}>
            <span className={styles.label}>Placa</span>
            <input name="placa" value={filters.placa || ''} onChange={handleChange} placeholder="Ej: TRL204" className={styles.input} />
          </div>
          
          <div className={styles.inputGroup}>
            <span className={styles.label}>Contenedor</span>
            <input name="containerNumber" value={filters.containerNumber || ''} onChange={handleChange} placeholder="MSKU..." className={styles.input} />
          </div>

          <div className={styles.inputGroup}>
            <span className={styles.label}>Fecha Prog.</span>
            <input name="date" type="date" value={filters.date || ''} onChange={handleChange} className={styles.input} />
          </div>

          <div className={styles.buttonsGroup}>
            <button type="submit" disabled={isLoading} className={styles.btnPrimary}>
              <Search size={14} /> {isLoading ? '...' : 'Buscar'}
            </button>
            <button type="button" onClick={handleClear} className={styles.btnSecondary} title="Limpiar">
              <X size={14} />
            </button>
            <button type="button" onClick={() => setIsExpanded(!isExpanded)} className={styles.btnSecondary} title="Avanzados">
              <Filter size={14} /> {isExpanded ? 'Menos' : 'Más'}
            </button>
          </div>
        </div>

        {/* FILA AVANZADA (Colapsable) */}
        {isExpanded && (
          <div className={styles.advancedRow}>
            <div className={styles.inputGroup}>
              <span className={styles.label}>Conductor</span>
              <input name="conductor" value={filters.conductor || ''} onChange={handleChange} placeholder="Nombre..." className={styles.input} />
            </div>
            
            <div className={styles.inputGroup}>
              <span className={styles.label}>Pedido / DO</span>
              <input name="numeroPedido" value={filters.numeroPedido || ''} onChange={handleChange} placeholder="DO-123" className={styles.input} />
            </div>

            <div className={styles.inputGroup}>
              <span className={styles.label}>Tipo Op.</span>
              <select name="type" value={filters.type || ''} onChange={handleChange} className={styles.input}>
                <option value="">Todos</option>
                <option value="IMPORTACION">Importación</option>
                <option value="EXPORTACION">Exportación</option>
                <option value="RETIRO_VACIO">Retiro Vacío</option>
                <option value="DEVOLUCION">Devolución</option>
              </select>
            </div>
          </div>
        )}

      </form>
    </div>
  );
};