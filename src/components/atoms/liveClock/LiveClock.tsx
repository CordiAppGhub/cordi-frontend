'use client';

import React, { useState, useEffect } from 'react';
import styles from '@/app/(panel)/dashboard/dashboard.module.css';

export function LiveClock() {
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    // Se ejecuta solo en el cliente tras el montaje, evitando el error de hidratación
    const updateTime = () => {
      setTimeString(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Mientras no se monte en el cliente, muestra un espacio o marcador neutral
  if (!timeString) {
    return <span className={styles.timeText}>🕒 --:--</span>;
  }

  return <span className={styles.timeText}>🕒 {timeString}</span>;
}