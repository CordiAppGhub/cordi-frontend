'use client';

import React, { ReactNode } from 'react';

// Si prefieres usar tu CSS module, puedes migrar estos estilos allí
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  padding: '1rem',
};

const defaultModalStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
};

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
    <div style={overlayStyle} onClick={handleOverlayClick}>
      <div 
        style={{ 
          ...defaultModalStyle, 
          width, 
          maxHeight 
        }}
      >
        {title && (
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
            {title}
          </h2>
        )}
        
        {/* Aquí se inyectará cualquier contenido que le pasemos (Formularios, Tablas, Textos) */}
        <div style={{ width: '100%' }}>
          {children}
        </div>
      </div>
    </div>
  );
};