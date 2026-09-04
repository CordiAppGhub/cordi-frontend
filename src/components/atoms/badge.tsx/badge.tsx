import React from 'react';
import styles from './badge.module.css';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default' }) => {
  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      {children}
    </span>
  );
};