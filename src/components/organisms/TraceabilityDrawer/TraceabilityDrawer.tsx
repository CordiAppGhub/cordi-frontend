'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './TraceabilityDrawer.module.css';
import { OperationTraceability } from '@/app/(panel)/operations/components/details/OperationTraceability';

interface TraceabilityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  context: { type: 'OPERATION' | 'CONTAINER' | 'ANALYST' | 'DRIVER' | 'VEHICLE'; id: string | number } | null;
}

export const TraceabilityDrawer: React.FC<TraceabilityDrawerProps> = ({ isOpen, onClose, context }) => {
  // Bloquear el scroll de la página principal cuando el drawer está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { 
      document.body.style.overflow = 'unset'; 
    };
  }, [isOpen]);

  if (!context) return null;

  return (
    <>
      {/* Overlay oscuro de fondo */}
      {isOpen && (
        <div 
          className={styles.overlay} 
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Contenedor del Drawer (Panel Lateral) */}
      <div className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}>
        
        {/* Cabecera Fija del Drawer */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>
              {context.type === 'OPERATION' && `Trazabilidad de Operación #${context.id}`}
              {context.type === 'DRIVER' && `Perfil y Trazabilidad del Conductor`}
              {context.type === 'VEHICLE' && `Historial del Vehículo`}
            </h2>
            <p className={styles.subtitle}>Auditoría forense y tiempos en vivo</p>
          </div>
          
          <button 
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Cerrar panel"
          >
            <X size={20} />
          </button>
        </div>

        {/* Área de contenido con scroll independiente */}
        <div className={styles.content}>
          {context.type === 'OPERATION' && (
            <OperationTraceability operationId={Number(context.id)} />
          )}
          
          {/* Espacio preparado para cuando hagas las otras vistas:
            {context.type === 'DRIVER' && <DriverTraceability driverId={context.id} />} 
          */}
        </div>
      </div>
    </>
  );
};