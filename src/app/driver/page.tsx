'use client';

import React, { useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDriverPortal } from '@/hooks/use-driverPortal';

import styles from './driver.module.css';
import { Button } from '@/components/atoms/button/button';
import { SuperModal } from '@/components/organisms/modal/modal';
import PaginationTable from '@/components/organisms/pagination-table/pagination-table';
import { DriverCardList } from './components/DriverCardList';
import { OperationWorkflow } from './components/workflow/operation-workflow';

function DriverPortalContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const {
    driver,
    loading,
    error,
    uploading,
    processingState,
    uploadEvidence,
    updateTravelState,
    scanPlate
  } = useDriverPortal(token);

  // Estado para alternar la vista: 'table' o 'cards'
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

  // Estados para el Modal de Detalle / Soportes / OCR
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<any | null>(null);
  const [modalType, setModalType] = useState<'DETAILS' | 'OCR' | 'CLOSING'>('DETAILS');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedOperation) return;

    try {
      if (modalType === 'OCR') {
        const result = await scanPlate(selectedOperation.id, file);
        if (result?.legible && result?.codigo) {
          alert(`✅ Escaneo exitoso: ${result.codigo}`);
          setIsModalOpen(false);
        } else {
          alert('⚠️ No se pudo leer correctamente. Intenta tomar otra foto.');
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

  if (loading) {
    return <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Cargando tu portal seguro...</div>;
  }

  if (error || !driver) {
    return (
      <div className={styles.container} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: '#dc2626', fontSize: '1.25rem', marginBottom: '8px' }}>Acceso No Autorizado</h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>{error || 'No se encontraron datos.'}</p>
      </div>
    );
  }

  const operationColumns = [
    { id: 'id', header: 'ID', isDraggable: false },
    { id: 'origen', header: 'Origen', isDraggable: true, renderCell: (row: any) => row.origen?.name || 'N/A' },
    { id: 'destino', header: 'Destino', isDraggable: true, renderCell: (row: any) => row.destino?.name || 'N/A' },
    { id: 'estadoViaje', header: 'Estado', isDraggable: false, renderCell: (row: any) => row.estadoViaje || 'ASIGNADO' },
    {
      id: 'acciones',
      header: 'Acciones',
      isDraggable: false,
      renderCell: (row: any) => (
        <Button
          variant="primary"
          onClick={() => {
            setSelectedOperation(row);
            setModalType('DETAILS');
            setIsModalOpen(true);
          }}
        >
          Ver Detalle
        </Button>
      )
    }
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <span className={styles.badge}>Portal Seguro</span>
          <h1 className={styles.title}>{driver.name}</h1>
          <p className={styles.subtitle}>Cédula: {driver.cedula}</p>
        </div>
      </header>

      <main className={styles.main}>
        {/* Barra de control para alternar vistas */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', width: '100%', flexWrap: 'wrap', gap: '12px' }}>
          <h2 className={styles.cardTitle} style={{ margin: 0 }}>📦 Mis Operaciones y Viajes</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant={viewMode === 'cards' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('cards')}
            >
              📋 Tarjetas
            </Button>
            <Button
              variant={viewMode === 'table' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('table')}
            >
              📊 Tabla
            </Button>
          </div>
        </div>

        {viewMode === 'cards' ? (
          <DriverCardList
            data={driver.assignedOperations}
            getStatus={(op) => op.estadoViaje || 'ASIGNADO'}
            renderCardContent={(op) => (
              <>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold', color: '#1e293b' }}>
                  {op.origen?.name} ➡️ {op.destino?.name}
                </p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                  Vehículo Placa: <strong>{op.vehicle?.plate || 'Sin asignar'}</strong>
                </p>

                <OperationWorkflow
                  operation={op}
                  isLoading={processingState}
                  onUpdateState={updateTravelState}
                  onOpenOcrModal={() => {
                    setSelectedOperation(op);
                    setModalType('OCR');
                    setIsModalOpen(true);
                  }}
                  onOpenClosingModal={() => {
                    setSelectedOperation(op);
                    setModalType('CLOSING');
                    setIsModalOpen(true);
                  }}
                />

                <Button
                  variant="secondary"
                  style={{ marginTop: '8px', width: '100%', fontSize: '0.75rem', padding: '6px' }}
                  onClick={() => {
                    setSelectedOperation(op);
                    setModalType('DETAILS');
                    setIsModalOpen(true);
                  }}
                >
                  ℹ️ Ver Información del Viaje
                </Button>
              </>
            )}
          />
        ) : (
          <PaginationTable
            data={driver.assignedOperations}
            columns={operationColumns}
            totalPages={1}
            currentPage={1}
            onPageChange={() => { }}
            nameButton="Actualizar"
          />
        )}
      </main>

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
            {/* Solo mostramos la info si es detalles o si están cerrando/escaneando */}
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
                    ? 'Toma una foto clara de la placa o los números del contenedor. La IA extraerá los datos automáticamente.'
                    : 'Toma una foto del documento soporte (tirilla, factura o cumplido) para finalizar la operación.'}
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
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Cargando...</div>}>
      <DriverPortalContent />
    </Suspense>
  );
}