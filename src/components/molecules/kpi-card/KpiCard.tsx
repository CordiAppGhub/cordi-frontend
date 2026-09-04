import React from 'react';
import styles from './kpi-card.module.css';

interface KpiCardProps {
  title: string;
  value: string | number;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
}

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, variant = 'default' }) => {
  return (
    <div className={`${styles.card} ${styles[variant]}`}>
      <div className={styles.value}>{value}</div>
      <div className={styles.title}>{title}</div>
    </div>
  );
};