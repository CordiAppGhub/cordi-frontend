// src/app/driver/page.tsx
'use client';

import React, { useState, useRef } from 'react';
import { useDriverPortal } from '@/hooks/use-driverPortal';
import { TruckLoader } from '@/components/TruckLoader';
import styles from './driver.module.css';
import { Button } from '@/components/atoms/button/button';
import { SuperModal } from '@/components/organisms/modal/modal';
import { Operation } from '@/types/driver-portal.types';
import { DriverHeaderNav } from './components/DriverHeaderNav';
import { DriverProfile } from './components/DriverProfile';
import { DriverAuthSection } from './views/DriverAuthSection';
import { HistoryTab } from './components/HistoryTab';
import { CurrentTripTab } from './components/CurrentTripTab';
import Swal from 'sweetalert2';



export default function DriverPortalPage() {
  const {
    driver,
    loading,
    uploading,
    processingState,
    isAuthenticated,
    authStep,
    setAuthStep,
    authError,
    requestOtp,
    verifyOtp,
    logout,
    uploadEvidence,
    updateTravelState,
    updateContainerStatus,
    scanPlate,
    scanContainer,
    history = [],
    loadingHistory
  } = useDriverPortal();

  const [cedulaInput, setCedulaInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
  const [selectedOperationId, setSelectedOperationId] = useState<number | null>(null);
  const [modalType, setModalType] = useState<'DETAILS' | 'OCR' | 'CLOSING'>('DETAILS');
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'profile'>('current');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const assignedOperations: Operation[] = driver?.assignedOperations || [];
  const firstSuggestedOperation =
    assignedOperations.find((operation) => operation.status === 'EN_CURSO') ||
    assignedOperations.find((operation) => operation.isActive) ||
    assignedOperations[0];

  const handleCedulaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cedulaInput.trim()) await requestOtp(cedulaInput.trim());
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput.trim() && cedulaInput.trim()) {
      await verifyOtp(cedulaInput.trim(), otpInput.trim());
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedOperation) return;

    try {
      if (modalType === 'OCR') {
        if (!selectedOperation.placaIA) {
          const result = await scanPlate(selectedOperation.id, file);
          if (result?.legible && result?.codigo) {
            Swal.fire(`✅ Placa detectada: ${result.codigo}\n\nAhora toma la foto del contenedor.`);
          } else {
            Swal.fire('⚠️ No se pudo leer la placa. Intenta de nuevo.');
          }
        } else {
          const result = await scanContainer(selectedOperation.id, file);
          if (result?.legible && result?.codigo) {
            Swal.fire(`✅ Contenedor validado: ${result.codigo}`);
            setIsModalOpen(false);
          } else {
            Swal.fire('⚠️ No se detectó un código válido. Intenta de nuevo.');
          }
        }
      } else if (modalType === 'CLOSING') {
        await uploadEvidence(selectedOperation.id, file);
        setIsModalOpen(false);
      }
    } catch (err: unknown) {
      Swal.fire(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error procesando la imagen.',
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isAuthenticated) {
    return (
      <DriverAuthSection
        authStep={authStep}
        authError={authError}
        cedulaInput={cedulaInput}
        setCedulaInput={setCedulaInput}
        otpInput={otpInput}
        setOtpInput={setOtpInput}
        onCedulaSubmit={handleCedulaSubmit}
        onOtpSubmit={handleOtpSubmit}
        onBackToCedula={() => setAuthStep('CEDULA')}
      />
    );
  }

  if (loading || !driver) {
    return <TruckLoader variant="page" message="Cargando tus datos..." />;
  }

  const activeOperation =
    assignedOperations.find((operation) => operation.id === selectedOperationId) ||
    firstSuggestedOperation;
  const vehiculo = activeOperation?.vehicle || driver.drivenVehicles?.[0];

  return (
    <div className={styles.dashboardContainer}>
      <DriverHeaderNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        historyCount={history.length}
        onLogout={logout}
      />

      {activeTab === 'current' ? (
        <CurrentTripTab
          driver={driver}
          assignedOperations={assignedOperations}
          activeOperation={activeOperation}
          onSelectOperation={setSelectedOperationId}
          vehiculo={vehiculo}
          processingState={processingState}
          onUpdateState={updateTravelState}
          onUpdateContainerStatus={updateContainerStatus}
          onOpenOcrModal={() => {
            setSelectedOperation(activeOperation || null);
            setModalType('OCR');
            setIsModalOpen(true);
          }}
          onOpenClosingModal={() => {
            setSelectedOperation(activeOperation || null);
            setModalType('CLOSING');
            setIsModalOpen(true);
          }}
          onOpenDetailsModal={() => {
            if (activeOperation) {
              setSelectedOperation(activeOperation);
              setModalType('DETAILS');
              setIsModalOpen(true);
            }
          }}
        />
      ) : activeTab === 'history' ? (
        <HistoryTab history={history} loadingHistory={loadingHistory} />
      ) : (
        <DriverProfile driver={driver} />
      )}

      <SuperModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          modalType === 'OCR' ? '📸 Escáner de IA' :
          modalType === 'CLOSING' ? '✅ Subir Soporte' : `Detalle #${selectedOperation?.id || ''}`
        }
      >
        {selectedOperation && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {modalType !== 'DETAILS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <Button
                  variant="primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || processingState}
                >
                  {(uploading || processingState) ? 'Procesando...' : '📸 Tomar Foto'}
                </Button>
              </div>
            )}
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cerrar</Button>
          </div>
        )}
      </SuperModal>
    </div>
  );
}