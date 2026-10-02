'use client';

import React, { ReactNode } from 'react';
import styles from './SuperModal.module.css';

interface SuperModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: string;       
  maxHeight?: string;   
}

export const SuperModal: React.FC<SuperModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = '500px',
  maxHeight = '90vh',
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div 
        className={styles.modal}
        style={{ width, maxHeight }} 
      >
        {title && (
          <h2 className={styles.title}>
            {title}
          </h2>
        )}
        
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
};