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
  onSaveChanges?: (updatedData: T[]) => void;
  onOpenModal?: () => void;
  nameButton?: string;
}

export default function PaginationTable<T extends { id: number | string }>({
  data,
  columns,
  totalPages,
  currentPage,
  onPageChange,
  onSaveChanges,
  onOpenModal,
  nameButton
}: SuperTableProps<T>) {
  const safeData = Array.isArray(data) ? data : [];

  // Estado local para los cambios pendientes de arrastrar y soltar
  const [localChanges, setLocalChanges] = useState<Map<string | number, Partial<T>>>(new Map());
  const [isEditing, setIsEditing] = useState(false);

  // Fusionamos los datos originales con los cambios locales pendientes de guardar
  const displayData = safeData.map((row) => {
    const changes = localChanges.get(row.id);
    return changes ? { ...row, ...changes } : row;
  });

  // ==========================================
  // LÓGICA DE DRAG AND DROP
  // ==========================================
  const handleDragStart = (e: React.DragEvent, rowId: string | number, columnId: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ rowId, columnId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string, isDraggable?: boolean) => {
    e.preventDefault();
    if (isDraggable) {
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDrop = (e: React.DragEvent, targetRowId: string | number, targetColumnId: string) => {
    e.preventDefault();
    const dragData = e.dataTransfer.getData('text/plain');
    if (!dragData) return;

    const { rowId: sourceRowId, columnId: sourceColumnId } = JSON.parse(dragData);

    if (sourceColumnId !== targetColumnId || sourceRowId === targetRowId) return;

    setLocalChanges((prev) => {
      const newMap = new Map(prev);

      const sourceRow = displayData.find((r) => r.id === sourceRowId);
      const targetRow = displayData.find((r) => r.id === targetRowId);

      if (!sourceRow || !targetRow) return prev;

      const sourceVal = sourceRow[sourceColumnId as keyof T];
      const targetVal = targetRow[targetColumnId as keyof T];

      const currentSourceChanges = newMap.get(sourceRowId) || {};
      const currentTargetChanges = newMap.get(targetRowId) || {};

      newMap.set(sourceRowId, {
        ...currentSourceChanges,
        [sourceColumnId]: targetVal
      } as Partial<T>);

      newMap.set(targetRowId, {
        ...currentTargetChanges,
        [targetColumnId]: sourceVal
      } as Partial<T>);

      return newMap;
    });
  };

  // ==========================================
  // ACCIONES DEL TOOLBAR
  // ==========================================
  const handleSave = () => {
    if (onSaveChanges) {
      const updatedData = displayData;
      onSaveChanges(updatedData);
    }
    setLocalChanges(new Map());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalChanges(new Map());
    setIsEditing(false);
  };

  return (
    <div className={styles.tableContainer}>
      <div className={styles.toolbar}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Buscar en la tabla..."
            className={styles.searchInput}
            disabled={isEditing}
          />
          <span className={styles.searchIcon}>🔍</span>
        </div>

        <div className={styles.actionButtons}>
          {isEditing ? (
            <>
              <button onClick={handleCancel} className={styles.btnSecondary}>
                Cancelar
              </button>
              <button onClick={handleSave} className={styles.btnPrimary} style={{ backgroundColor: '#10b981' }}>
                ✓ Aceptar
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className={styles.btnSecondary}
              >
                ✏️ Reasignar Datos
              </button>
              <button
                type="button"
                onClick={onOpenModal ? onOpenModal : () => alert('Abrir modal')}
                className={styles.btnPrimary}
              >
                {nameButton}
              </button>
            </>
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
                  {isEditing && column.isDraggable && <span title="Columna editable" style={{ marginLeft: '4px' }}>🔄</span>}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {displayData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={styles.emptyState}>
                  No hay datos para mostrar
                </td>
              </tr>
            ) : (
              displayData.map((row) => (
                <tr key={row.id} className={styles.row}>
                  {columns.map((column, index) => {
                    const canDrag = isEditing && column.isDraggable;

                    return (
                      <td
                        key={`${String(column.id)}-${row.id}-${index}`}
                        className={`${styles.td} ${canDrag ? styles.draggableCell : ''}`}
                        draggable={canDrag}
                        onDragStart={(e) => canDrag && handleDragStart(e, row.id, column.id)}
                        onDragOver={(e) => canDrag && handleDragOver(e, column.id, column.isDraggable)}
                        onDrop={(e) => canDrag && handleDrop(e, row.id, column.id)}
                        style={canDrag ? { cursor: 'grab', border: '1px dashed #cbd5e1' } : {}}
                      >
                        {column.renderCell
                          ? column.renderCell(row)
                          : String(row[column.id as keyof T] ?? '-')}
                      </td>
                    );
                  })}
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
            onClick={() => {
              handleCancel();
              onPageChange(Math.max(1, currentPage - 1));
            }}
            disabled={currentPage <= 1 || isEditing}
            className={styles.pageBtn}
          >
            Anterior
          </button>
          <span className={styles.pageInfo}>
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => {
              handleCancel();
              onPageChange(Math.min(totalPages, currentPage + 1));
            }}
            disabled={currentPage >= totalPages || isEditing}
            className={styles.pageBtn}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}