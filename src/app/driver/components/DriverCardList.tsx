'use client';

import React from 'react';
import styles from './driver-card-list.module.css'; // O ajusta tus estilos modulares

interface DriverCardListProps<T> {
  data: T[];
  renderCardContent: (item: T) => React.ReactNode;
  getStatus: (item: T) => string; // Función para extraer el estado y agrupar o etiquetar
}

export function DriverCardList<T extends { id: number | string }>({
  data,
  renderCardContent,
  getStatus,
}: DriverCardListProps<T>) {
  const safeData = Array.isArray(data) ? data : [];

  if (safeData.length === 0) {
    return <div className={styles.emptyState}>No hay registros para mostrar en formato de tarjetas.</div>;
  }

  return (
    <div className={styles.gridContainer}>
      {safeData.map((item) => {
        const status = getStatus(item);
        return (
          <div key={item.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.badge}>{status || 'GENERAL'}</span>
            </div>
            <div className={styles.cardBody}>
              {renderCardContent(item)}
            </div>
          </div>
        );
      })}
    </div>
  );
}