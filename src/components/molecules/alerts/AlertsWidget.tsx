'use client';

import React from 'react';
import styles from '@/app/(panel)/dashboard/dashboard.module.css';

interface Props {
  alertasCriticas: {
    mantenimiento: number;
    soatVencido: number;
    novedades: number;
    desvios: number;
  };
}

export const AlertsWidget: React.FC<Props> = ({ alertasCriticas }) => {
  return (
    <div className={styles.widgetCard}>
      <h3>Alertas críticas</h3>
      <ul className={styles.alertList}>
        <li>
          <span><span style={{ color: '#dc2626' }}>⚠️</span> Mantenimientos</span>
          <span style={{ fontWeight: 'bold' }}>{alertasCriticas.mantenimiento}</span>
        </li>
        <li>
          <span><span style={{ color: '#f59e0b' }}>⚠️</span> SOAT por vencer</span>
          <span style={{ fontWeight: 'bold' }}>{alertasCriticas.soatVencido}</span>
        </li>
        <li>
          <span><span style={{ color: '#dc2626' }}>🚨</span> Fallas Activas</span>
          <span style={{ fontWeight: 'bold' }}>{alertasCriticas.novedades}</span>
        </li>
        {/* 🚀 NUEVO: Alerta de Desvíos */}
        {alertasCriticas.desvios > 0 && (
          <li style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
            <span><span style={{ color: '#d97706' }}>🔄</span> Desvíos en Ruta</span>
            <span style={{ fontWeight: 'bold', color: '#b45309' }}>{alertasCriticas.desvios}</span>
          </li>
        )}
      </ul>
      <a href="/novedades" className={styles.widgetLink}>Ver panel de alertas</a>
    </div>
  );
};