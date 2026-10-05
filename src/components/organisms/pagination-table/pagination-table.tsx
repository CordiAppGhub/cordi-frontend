'use client';

import React, { useState } from 'react';
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
  isCollapsible?: boolean;
  subColumns?: ColumnDef<any>[];
  getSubRows?: (row: T) => any[];
}

export default function PaginationTable<T extends { id: number | string }>({
  data,
  columns,
  totalPages,
  currentPage,
  onPageChange,
  onOpenModal,
  nameButton,
  isCollapsible = false,
  subColumns,
  getSubRows,
}: SuperTableProps<T>) {
  const safeData = Array.isArray(data) ? data : [];
  const [expandedRows, setExpandedRows] = useState<Set<number | string>>(new Set());

  const toggleRow = (id: number | string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={styles.tableContainer}>
      {/* TOOLBAR */}
      <div className={styles.toolbar}>
        <div className={styles.searchContainer}>
          <input type="text" placeholder="Buscar en la tabla..." className={styles.searchInput} />
          <span className={styles.searchIcon}>🔍</span>
        </div>
        <div className={styles.actionButtons}>
          {nameButton && (
            <button type="button" onClick={onOpenModal ? onOpenModal : () => alert('Falta la función onOpenModal')} className={styles.btnPrimary}>
              {nameButton}
            </button>
          )}
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {isCollapsible && <th className={`${styles.th} ${styles.expandCell}`}></th>}
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
                <td colSpan={isCollapsible ? columns.length + 1 : columns.length} className={styles.emptyState}>
                  No hay datos para mostrar
                </td>
              </tr>
            ) : (
              safeData.map((row) => {
                const isExpanded = expandedRows.has(row.id);
                const subRows = getSubRows ? getSubRows(row) : [];

                return (
                  <React.Fragment key={row.id}>
                    {/* FILA PADRE */}
                    <tr 
                      className={`${styles.row} ${isCollapsible ? styles.clickableRow : ''}`}
                      onClick={() => isCollapsible && toggleRow(row.id)}
                    >
                      {isCollapsible && (
                        <td className={`${styles.td} ${styles.expandCell}`}>
                          <svg
                            className={`${styles.expandIcon} ${isExpanded ? styles.expandIconExpanded : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </td>
                      )}
                      {columns.map((column, index) => (
                        <td key={`${String(column.id)}-${row.id}-${index}`} className={styles.td}>
                          {column.renderCell ? column.renderCell(row) : String(row[column.id as keyof T] ?? '-')}
                        </td>
                      ))}
                    </tr>

                    {/* 🚀 TABLA ANIDADA (AUTOMÁTICA) */}
                    {isCollapsible && isExpanded && subColumns && subRows.length > 0 && (
                      <tr className={styles.expandedRow}>
                        <td colSpan={columns.length + 1} style={{ padding: 0, border: 'none' }}>
                          <div className={styles.nestedTableWrapper}>
                            <table className={styles.nestedTable}>
                              <thead>
                                <tr>
                                  {subColumns.map((subCol, i) => (
                                    <th key={`subTh-${i}`} className={styles.nestedTh}>{subCol.header}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {subRows.map((subRow: any, j: number) => (
                                  <tr key={`subTr-${subRow.id || j}`} className={styles.nestedTr}>
                                    {subColumns.map((subCol, k) => (
                                      <td key={`subTd-${k}`} className={styles.nestedTd}>
                                        {subCol.renderCell ? subCol.renderCell(subRow) : String(subRow[subCol.id] ?? '-')}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN */}
      <div className={styles.pagination}>
        <div className={styles.pageInfo}>Página {currentPage} de {totalPages}</div>
        <div className={styles.paginationControls}>
          <button type="button" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage <= 1} className={styles.pageBtn}>Anterior</button>
          <span className={styles.pageInfo}>{currentPage} / {totalPages}</span>
          <button type="button" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages} className={styles.pageBtn}>Siguiente</button>
        </div>
      </div>
    </div>
  );
}