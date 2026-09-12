'use client';

import React from 'react';
import { Button } from '@/components/atoms/button/button';
import styles from './operation-workflow.module.css';

// Definimos la interfaz basándonos en tu DriverPortalData
interface OperationData {
  id: number;
  type?: string;
  estadoViaje?: string;
  status?: string;
}

interface OperationWorkflowProps {
  operation: OperationData;
  isLoading: boolean;
  onUpdateState: (operationId: number, newState: string) => Promise<void>;
  onOpenOcrModal: () => void;
  onOpenClosingModal: () => void;
}

export function OperationWorkflow({
  operation,
  isLoading,
  onUpdateState,
  onOpenOcrModal,
  onOpenClosingModal,
}: OperationWorkflowProps) {
  
  // Envoltorio para manejar el clic y llamar a la actualización de estado
  const handleAdvance = (newState: string) => {
    onUpdateState(operation.id, newState);
  };

  const renderAction = () => {
    switch (operation.estadoViaje) {
      case 'ASIGNADO':
      case null:
      case undefined:
        return (
          <Button 
            variant="primary" 
            className={styles.btnIniciar}
            onClick={() => handleAdvance('RUMBO_AL_PUERTO')} 
            disabled={isLoading}
          >
            🚀 Iniciar Viaje (Rumbo al Puerto)
          </Button>
        );
      
      case 'RUMBO_AL_PUERTO':
        return (
          <Button 
            variant="primary" 
            className={styles.btnLlegadaPuerto}
            onClick={() => handleAdvance('EN_PUERTO')} 
            disabled={isLoading}
          >
            📍 Llegué al Puerto
          </Button>
        );

      case 'EN_PUERTO':
        return (
          <Button 
            variant="primary" 
            className={styles.btnEscanear}
            onClick={onOpenOcrModal}
            disabled={isLoading}
          >
            📸 Escanear Placa y Contenedor
          </Button>
        );

      case 'EN_PUERTO_CARGADO':
        return (
          <Button 
            variant="primary" 
            className={styles.btnSalirPuerto}
            onClick={() => handleAdvance('RUMBO_AL_CLIENTE')} 
            disabled={isLoading}
          >
            🚛 Salir del Puerto (En ruta)
          </Button>
        );

      case 'RUMBO_AL_CLIENTE':
        return (
          <Button 
            variant="primary" 
            className={styles.btnLlegadaCliente}
            onClick={() => handleAdvance('EN_CLIENTE')} 
            disabled={isLoading}
          >
            📍 Llegué a Instalaciones del Cliente
          </Button>
        );

      case 'EN_CLIENTE':
        return (
          <Button 
            variant="primary" 
            className={styles.btnFinalizar}
            onClick={onOpenClosingModal}
            disabled={isLoading}
          >
            ✅ Iniciar Descargue y Finalizar
          </Button>
        );

      case 'FINALIZADO':
        return (
          <div className={styles.viajeFinalizado}>
            🎉 Viaje Finalizado con Éxito
          </div>
        );

      default:
        return (
          <div style={{ color: '#dc2626', fontSize: '0.875rem', textAlign: 'center' }}>
            Estado desconocido: {operation.estadoViaje}
          </div>
        );
    }
  };

  return (
    <div className={styles.container}>
      {renderAction()}
    </div>
  );
}