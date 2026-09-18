'use client';

import React, { useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDriverPortal } from '@/hooks/use-driverPortal';

import styles from './driver.module.css';
import { Button } from '@/components/atoms/button/button';
import { SuperModal } from '@/components/organisms/modal/modal';
import { OperationWorkflow } from './components/workflow/operation-workflow';
import { Operation } from '@/types/driver-portal.types';

function DriverPortalContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const {
    driver,
    loading,
    error,
    uploading,
    processingState,
    isAuthenticated,
    authenticateDriver,
    uploadEvidence,
    updateTravelState,
    scanPlate,
    scanContainer
  } = useDriverPortal(token);

  const [cedulaInput, setCedulaInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
  const [modalType, setModalType] = useState<'DETAILS' | 'OCR' | 'CLOSING'>('DETAILS');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cedulaInput.trim()) {
      authenticateDriver(cedulaInput.trim());
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
            alert(`✅ Placa detectada: ${result.codigo}\n\nAhora toma la foto del contenedor.`);
          } else {
            alert('⚠️ No se pudo leer la placa. Intenta de nuevo.');
          }
        } else {
          const result = await scanContainer(selectedOperation.id, file);
          if (result?.legible && result?.codigo) {
            alert(`✅ Contenedor validado: ${result.codigo}`);
            setIsModalOpen(false);
          } else {
            alert('⚠️ No se detectó un código ISO válido. Intenta de nuevo.');
          }
        }
      } else if (modalType === 'CLOSING') {
        await uploadEvidence(selectedOperation.id, file);
        setIsModalOpen(false);
      }
    } catch (err: any) {
      alert(err.message || 'Ocurrió un error procesando la imagen.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 1. Validar si falta el token en la URL
  if (!token) {
    return (
      <div className={styles.container} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: '#dc2626', fontSize: '1.25rem', marginBottom: '8px' }}>Enlace Inválido</h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>No se ha proporcionado un token de acceso.</p>
      </div>
    );
  }

  // 2. Pantalla de carga inicial
  if (loading && !driver) {
    return (
      <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', height: '100vh' }}>
        Cargando tu portal seguro...
      </div>
    );
  }

  // 3. Pantalla de Autenticación por Cédula
  if (!isAuthenticated) {
    return (
      <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <span className={styles.badge} style={{ marginBottom: '12px', display: 'inline-block' }}>Portal Seguro</span>
          <h2 style={{ color: '#1e293b', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px' }}>Validación de Identidad</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>Por seguridad, ingresa tu número de cédula para ver tus viajes asignados.</p>
          
          {error && (
            <div style={{ color: '#dc2626', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input 
              type="text" 
              placeholder="Número de cédula"
              value={cedulaInput}
              onChange={(e) => setCedulaInput(e.target.value)}
              required
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', width: '100%', outline: 'none' }}
              autoFocus
            />
            <Button variant="primary" type="submit" style={{ padding: '12px', fontSize: '1rem', width: '100%' }}>
              {loading ? 'Verificando...' : 'Acceder al Portal'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // 4. Si pasó autenticación pero driver es nulo
  if (!driver) {
    return (
      <div className={styles.container} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: '#dc2626', fontSize: '1.25rem', marginBottom: '8px' }}>Sin Datos</h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>No se encontraron registros asociados a este conductor.</p>
      </div>
    );
  }

  // --- LOGICA PRINCIPAL DEL DASHBOARD TIPO APP ---
  const activeOperation = driver?.assignedOperations?.[0]; 
  const vehiculo = activeOperation?.vehicle || driver?.drivenVehicles?.[0];

  return (
    <div className={styles.dashboardContainer}>
      
      {/* SECCIÓN SUPERIOR: Vehículo y Viaje Actual */}
      <div className={styles.gridLayout}>
        
        {/* TARJETA IZQUIERDA (Info del viaje) */}
        <div className={styles.infoCard}>
          
          {/* Cabecera Vehículo */}
          <div className={styles.vehicleHeader}>
            <div className={styles.truckIconBox}>🚛</div>
            <div className={styles.truckData}>
              <h2>{vehiculo?.plate || 'SIN ASIGNAR'}</h2>
              <p>KM actual: 125.680</p>
            </div>
            <span className={styles.statusBadgeGreen}>Operativa</span>
          </div>

          <hr className={styles.divider} />

          {/* Datos del Viaje */}
          <div className={styles.tripDetails}>
            <h3 style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '12px' }}>VIAJE ACTUAL</h3>
            {activeOperation ? (
              <div className={styles.tripDataGrid}>
                <span className={styles.label}>Cliente</span>
                <span className={styles.value}>{activeOperation.destino?.name || '---'}</span>
                
                <span className={styles.label}>Remesa</span>
                <span className={styles.value}>OT-{activeOperation.id}</span>
                
                <span className={styles.label}>Ruta</span>
                <span className={styles.value}>{activeOperation.origen?.name} ➡️ {activeOperation.destino?.name}</span>
                
                <span className={styles.label}>Cita cargue</span>
                <span className={styles.value}>08:00 AM</span>
              </div>
            ) : (
              <p className={styles.emptyState}>No tienes viajes asignados en este momento.</p>
            )}
            
            {activeOperation && (
              <a 
                href="#" 
                className={styles.linkDetails}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedOperation(activeOperation);
                  setModalType('DETAILS');
                  setIsModalOpen(true);
                }}
              >
                Ver detalles &gt;
              </a>
            )}
          </div>

          {/* Botones de Acción */}
          <div className={styles.actionButtonsRow}>
            <button className={styles.secondaryBtn}>
              <span className={styles.btnIcon}>🛡️</span>
              <div className={styles.btnTexts}>
                <strong>PREOPERACIONAL</strong>
                <span>Inspección diaria</span>
              </div>
            </button>
            <button className={styles.dangerBtn}>
              <span className={styles.btnIcon}>⚠️</span>
              <div className={styles.btnTexts}>
                <strong>REPORTAR NOVEDAD</strong>
                <span>Fallas, incidentes, otros</span>
              </div>
            </button>
          </div>
        </div>

        {/* TARJETA DERECHA (Secuencia de Viaje) */}
        <div className={styles.sequenceCard}>
          {activeOperation ? (
            <OperationWorkflow
              operation={activeOperation}
              isLoading={processingState}
              onUpdateState={updateTravelState}
              onOpenOcrModal={() => {
                setSelectedOperation(activeOperation);
                setModalType('OCR');
                setIsModalOpen(true);
              }}
              onOpenClosingModal={() => {
                setSelectedOperation(activeOperation);
                setModalType('CLOSING');
                setIsModalOpen(true);
              }}
            />
          ) : (
            <div className={styles.emptyWorkflow}>
              <span style={{ fontSize: '2rem' }}>☕</span>
              <p style={{ color: '#64748b', marginTop: '12px' }}>Esperando asignación de viaje...</p>
            </div>
          )}
        </div>
      </div>

      {/* STRIP DE DATOS EN TIEMPO REAL */}
      <div className={styles.liveStatsStrip}>
        <div className={styles.statItem}><span>Km recorrido</span><strong>18.6</strong></div>
        <div className={styles.statItem}><span>Horas motor</span><strong>01:42</strong></div>
        <div className={styles.statItem}><span>Velocidad prom.</span><strong>32 km/h</strong></div>
        <div className={styles.statItem}>
          <span>Estado GPS</span>
          <strong><span className={styles.dotGreen}></span> Conectado</strong>
        </div>
      </div>

      {/* MODAL UNIVERSAL PARA DETALLES Y FOTOS */}
      <SuperModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          modalType === 'OCR' ? '📸 Escáner de Inteligencia Artificial' :
            modalType === 'CLOSING' ? '✅ Subir Soporte de Cierre' :
              selectedOperation ? `Detalle de Operación #${selectedOperation.id}` : 'Detalle'
        }
      >
        {selectedOperation && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '0.875rem', color: '#475569', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <p style={{ margin: 0 }}><strong>Origen:</strong> {selectedOperation.origen?.name}</p>
              <p style={{ margin: 0 }}><strong>Destino:</strong> {selectedOperation.destino?.name}</p>
              <p style={{ margin: 0 }}><strong>Estado actual:</strong> {selectedOperation.estadoViaje || 'ASIGNADO'}</p>
              <p style={{ margin: 0 }}><strong>Vehículo:</strong> {selectedOperation.vehicle?.plate}</p>
            </div>

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

                <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', marginBottom: '8px' }}>
                  {modalType === 'OCR'
                    ? (!selectedOperation.placaIA
                      ? 'Paso 1: Toma una foto clara de la PLACA del vehículo.'
                      : 'Paso 2: Toma una foto del número del CONTENEDOR.')
                    : 'Toma una foto del documento soporte (tirilla, factura o cumplido).'}
                </p>

                <Button
                  variant="primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || processingState}
                  style={{ backgroundColor: modalType === 'OCR' ? '#9333ea' : '#059669' }}
                >
                  {(uploading || processingState) ? 'Procesando...' : '📸 Tomar Foto'}
                </Button>
              </div>
            )}

            <Button
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cerrar
            </Button>
          </div>
        )}
      </SuperModal>
    </div>
  );
}

export default function DriverPortalPage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Cargando app...</div>}>
      <DriverPortalContent />
    </Suspense>
  );
}