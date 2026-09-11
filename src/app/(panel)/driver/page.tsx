'use client';

import { useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDriverPortal } from '@/hooks/use-driverPortal';
import styles from './driver.module.css';

function DriverPortalContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const { driver, loading, error, uploading, uploadEvidence } = useDriverPortal(token);
  const [selectedOperation, setSelectedOperation] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedOperation) return;

    try {
      await uploadEvidence(selectedOperation.id, file);
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
        {/* Vehículos */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>🚗 Mis Vehículos</h2>
          {driver.drivenVehicles.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: '#64748b', fontStyle: 'italic' }}>No tienes vehículos asignados.</p>
          ) : (
            driver.drivenVehicles.map((v) => (
              <div key={v.id} className={styles.itemRow}>
                <div>
                  <span className={styles.itemTitle}>{v.plate}</span>
                  <p className={styles.itemSub}>{v.brand} • {v.empresa}</p>
                </div>
                <span className={styles.statusBadge}>{v.status}</span>
              </div>
            ))
          )}
        </section>

        {/* Operaciones */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>📦 Viajes y Operaciones</h2>
          {driver.assignedOperations.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: '#64748b', fontStyle: 'italic' }}>No tienes operaciones registradas.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {driver.assignedOperations.map((op) => (
                <div key={op.id} className={styles.operationCard}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Ruta Asignada</span>
                    <p style={{ fontWeight: '600', fontSize: '0.875rem', color: '#1e293b', margin: '2px 0 0 0' }}>
                      {op.origen?.name} ➡️ {op.destino?.name}
                    </p>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                    Placa: <strong style={{ color: '#1e293b' }}>{op.vehicle?.plate}</strong>
                  </div>
                  <button
                    onClick={() => setSelectedOperation(op)}
                    className={styles.buttonPrimary}
                  >
                    Ver Detalle y Enviar Soportes
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal de Soportes / Cámara */}
      {selectedOperation && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Operación #{selectedOperation.id}</h3>
              <button onClick={() => setSelectedOperation(null)} style={{ background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <div style={{ fontSize: '0.875rem', color: '#475569', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p style={{ margin: 0 }}><strong>Origen:</strong> {selectedOperation.origen?.name}</p>
              <p style={{ margin: 0 }}><strong>Destino:</strong> {selectedOperation.destino?.name}</p>
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
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={styles.buttonCamera}
                style={{ opacity: uploading ? 0.7 : 1 }}
              >
                📸 {uploading ? 'Subiendo...' : 'Tomar Foto o Elegir Imagen'}
              </button>
              <button
                onClick={() => setSelectedOperation(null)}
                className={styles.buttonSecondary}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
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