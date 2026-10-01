'use client';

import React from 'react';
import { useUIStore } from '@/store/use-ui.store';
import styles from './global-loader.module.css';

export const GlobalLoader = () => {
  const isGlobalLoading = useUIStore((state) => state.isGlobalLoading);

  if (!isGlobalLoading) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.truckContainer}>
        {/* SVG de Tractomula */}
        <svg viewBox="0 0 120 70" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Contenedor (Tráiler) */}
          <rect x="5" y="10" width="75" height="45" rx="3" fill="#1e293b" />
          {/* Líneas de detalle del contenedor */}
          <line x1="25" y1="10" x2="25" y2="55" stroke="#334155" strokeWidth="2" />
          <line x1="45" y1="10" x2="45" y2="55" stroke="#334155" strokeWidth="2" />
          <line x1="65" y1="10" x2="65" y2="55" stroke="#334155" strokeWidth="2" />
          
          {/* Cabezote (Cabina) */}
          <path d="M85 25h15l12 15v15H85V25z" fill="#2563eb" />
          {/* Ventana */}
          <path d="M100 28h8l7 10h-15V28z" fill="#bae6fd" />
          
          {/* Llantas Tráiler */}
          <g className={styles.wheel} style={{ transformOrigin: '20px 58px' }}>
            <circle cx="20" cy="58" r="7" fill="#0f172a" />
            <circle cx="20" cy="58" r="3" fill="#cbd5e1" />
          </g>
          <g className={styles.wheel} style={{ transformOrigin: '40px 58px' }}>
            <circle cx="40" cy="58" r="7" fill="#0f172a" />
            <circle cx="40" cy="58" r="3" fill="#cbd5e1" />
          </g>
          
          {/* Llantas Cabezote */}
          <g className={styles.wheel} style={{ transformOrigin: '92px 58px' }}>
            <circle cx="92" cy="58" r="7" fill="#0f172a" />
            <circle cx="92" cy="58" r="3" fill="#cbd5e1" />
          </g>
          <g className={styles.wheel} style={{ transformOrigin: '108px 58px' }}>
            <circle cx="108" cy="58" r="7" fill="#0f172a" />
            <circle cx="108" cy="58" r="3" fill="#cbd5e1" />
          </g>
        </svg>
      </div>
      
      {/* Carretera animada */}
      <div className={styles.road}>
        <div className={styles.roadLine}></div>
      </div>
      
      <div className={styles.text}>Cargando operaciones...</div>
    </div>
  );
};