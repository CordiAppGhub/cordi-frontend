'use client';

import React, { ReactNode } from 'react';
import styles from './SuperModal.module.css'; // 🚀 Importamos el módulo CSS

interface SuperModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: string;       // Ancho dinámico (ej: '500px', '80%')
  maxHeight?: string;   // Altura máxima antes de hacer scroll interno
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

  // Cerramos el modal si el usuario hace clic fuera de la caja blanca
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div 
        className={styles.modal}
        // Conservamos los estilos en línea solo para las props dinámicas
        style={{ width, maxHeight }} 
      >
        {title && (
          <h2 className={styles.title}>
            {title}
          </h2>
        )}
        
        {/* Aquí se inyectará cualquier contenido que le pasemos (Formularios, Tablas, Textos) */}
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
};