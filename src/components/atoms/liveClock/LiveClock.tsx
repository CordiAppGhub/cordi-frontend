'use client';

import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import styles from './live-clock.module.css';

interface LiveClockProps {
  onRefresh: () => void;
  isRefetching?: boolean;
}

export const LiveClock: React.FC<LiveClockProps> = ({ onRefresh, isRefetching = false }) => {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // 1. Evitamos el setState síncrono para que el linter no moleste
    const mountTimer = setTimeout(() => {
      setMounted(true);
    }, 0);
    
    // 2. Actualizamos el reloj cada segundo exacto
    const clockTimer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearTimeout(mountTimer);
      clearInterval(clockTimer);
    };
  }, []);

  // Esqueleto para evitar parpadeos e hidratación fallida
  if (!mounted) return <div className={styles.pill} style={{ height: '36px', width: '210px' }} />;

  // 👇 AQUÍ ESTÁ LA MAGIA: Agregamos `second: '2-digit'`
  const formattedTime = time.toLocaleTimeString('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit', 
    hour12: true
  });

  return (
    <div className={styles.pill}>
      <div className={styles.timeWrapper}>
        <Clock size={16} strokeWidth={2.5} />
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formattedTime}</span>
      </div>
      
      <button 
        type="button" 
        onClick={onRefresh} 
        disabled={isRefetching}
        className={styles.refreshBtn}
      >
        <span>Actualizar</span>
        <RefreshCw 
          size={16} 
          strokeWidth={2.5} 
          className={isRefetching ? styles.spinIcon : ''} 
        />
      </button>
    </div>
  );
};