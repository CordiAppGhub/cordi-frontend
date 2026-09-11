'use client';

import React, { useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDriverPortal } from '@/hooks/use-driverPortal';

import styles from './driver.module.css';
import { Button } from '@/components/atoms/button/button';
import { SuperModal } from '@/components/organisms/modal/modal';
import PaginationTable from '@/components/organisms/pagination-table/pagination-table';
import { DriverCardList } from './components/DriverCardList';

function DriverPortalContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const { driver, loading, error, uploading, uploadEvidence } = useDriverPortal(token);
  
  // Estado para alternar la vista: 'table' o 'cards'
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  
  // Estados para el Modal de Detalle / Soportes
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedOperation) return;

    try {
      await uploadEvidence(selectedOperation.id, file);
      setIsModalOpen(false);
      setSelectedOperation(null);
    } catch (err: any) {
      alert(err.message);
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

  // Columnas de ejemplo para la tabla si eligen ver en modo tabla
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
          onClick={() => { setSelectedOperation(row); setIsModalOpen(true); }}
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

        {/* Renderizado Condicional según la elección del cliente */}
        {viewMode === 'cards' ? (
          <DriverCardList
            data={driver.assignedOperations}
            getStatus={(op) => op.status || 'ACTIVO'}
            renderCardContent={(op) => (
              <>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold', color: '#1e293b' }}>
                  {op.origen?.name} ➡️ {op.destino?.name}
                </p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                  Vehículo Placa: <strong>{op.vehicle?.plate || 'Sin asignar'}</strong>
                </p>
                <Button 
                  variant="primary" 
                  style={{ marginTop: '8px', width: '100%' }}
                  onClick={() => { setSelectedOperation(op); setIsModalOpen(true); }}
                >
                  Ver Detalle y Subir Soportes
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
            onPageChange={() => {}}
            nameButton="Actualizar"
          />
        )}
      </main>

      {/* Uso de tu componente SuperModal reutilizable */}
      <SuperModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={selectedOperation ? `Detalle de Operación #${selectedOperation.id}` : 'Detalle'}
      >
        {selectedOperation && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '0.875rem', color: '#475569', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <p style={{ margin: 0 }}><strong>Origen:</strong> {selectedOperation.origen?.name}</p>
              <p style={{ margin: 0 }}><strong>Destino:</strong> {selectedOperation.destino?.name}</p>
              <p style={{ margin: 0 }}><strong>Estado actual:</strong> {selectedOperation.estadoViaje || 'ACTIVO'}</p>
              <p style={{ margin: 0 }}><strong>Vehículo:</strong> {selectedOperation.vehicle?.plate}</p>
            </div>

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
                disabled={uploading}
                style={{ backgroundColor: '#059669' }}
              >
                📸 {uploading ? 'Subiendo...' : 'Tomar Foto o Elegir Imagen'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
              >
                Cerrar
              </Button>
            </div>
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