import React from 'react';
import styles from './sla-badge.module.css';

interface SLABadgeProps {
  status: 'verde' | 'amarillo' | 'rojo';
  days: number;
}

export const SLABadge: React.FC<SLABadgeProps> = ({ status, days }) => {
  const badgeClass = styles[status];
  const dotClass = status === 'verde' ? styles.dotVerde : status === 'amarillo' ? styles.dotAmarillo : styles.dotRojo;

  return (
    <div className={`${styles.badge} ${badgeClass}`}>
      <span className={`${styles.dot} ${dotClass}`}></span>
      {days} {days === 1 ? 'día' : 'días'}
    </div>
  );
};