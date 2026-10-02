'use client';

import React from 'react';
import { ColumnDef } from '@/types/table';
import styles from './pagination-table.module.css';

interface SuperTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onOpenModal?: () => void;
  nameButton?: string;
}

export default function PaginationTable<T extends { id: number | string }>({
  data,
  columns,
  totalPages,
  currentPage,
  onPageChange,
  onOpenModal,
  nameButton
}: SuperTableProps<T>) {
  const safeData = Array.isArray(data) ? data : [];

  return (
    <div className={styles.tableContainer}>
      {/* TOOLBAR LIMPIO */}
      <div className={styles.toolbar}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Buscar en la tabla..."
            className={styles.searchInput}
          />
          <span className={styles.searchIcon}>🔍</span>
        </div>

        <div className={styles.actionButtons}>
          {nameButton && (
            <button
              type="button"
              onClick={onOpenModal ? onOpenModal : () => alert('Falta la función onOpenModal')}
              className={styles.btnPrimary}
            >
              {nameButton}
            </button>
          )}
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={`${String(column.id)}-${index}`} className={styles.th}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {safeData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={styles.emptyState}>
                  No hay datos para mostrar
                </td>
              </tr>
            ) : (
              safeData.map((row) => (
                <tr key={row.id} className={styles.row}>
                  {columns.map((column, index) => (
                    <td
                      key={`${String(column.id)}-${row.id}-${index}`}
                      className={styles.td}
                    >
                      {column.renderCell
                        ? column.renderCell(row)
                        : String(row[column.id as keyof T] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <div className={styles.pageInfo}>
          Página {currentPage} de {totalPages}
        </div>
        <div className={styles.paginationControls}>
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className={styles.pageBtn}
          >
            Anterior
          </button>
          <span className={styles.pageInfo}>
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className={styles.pageBtn}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}