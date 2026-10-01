'use client';

import React, { useState } from 'react';
import styles from './novedades.module.css';
import { Tabs } from '@/components/molecules/tabs/tabs';
import { useNovedades } from '@/hooks/ueNovedades';
import { LiveClock } from '@/components/atoms/liveClock/LiveClock';

// Definición de las Tabs con íconos
const NOVEDADES_TABS = [
  { id: 'PENDING', label: 'Urgencias y Bloqueos', icon: '🚨' },
  { id: 'RESOLVED', label: 'Historial Resueltas', icon: '✅' },
  { id: 'TODAS', label: 'Todas las Incidencias', icon: '🗂️' },
];

export function NovedadesPageView() {
  const { novedades, isLoading, error, activeTab, setActiveTab, refresh, resolve } = useNovedades('PENDING');
  const [selectedForResolve, setSelectedForResolve] = useState<number | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const handleResolveSubmit = async (id: number) => {
    if (!resolutionNotes.trim()) {
      alert('Debe ingresar las notas de resolución para liberar los recursos.');
      return;
    }
    const success = await resolve(id, resolutionNotes);
    if (success) {
      setSelectedForResolve(null);
      setResolutionNotes('');
      refresh();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Centro de Control de Novedades e Incidentes</h1>
          <p className={styles.subtitle}>Gestión de bloqueos operativos, fallas mecánicas e incapacidades.</p>
        </div>
       <LiveClock onRefresh={refresh} isRefetching={isLoading} />
      </div>

      {/* AQUÍ VA TU NUEVO COMPONENTE UNIVERSAL SÚPER POTENTE */}
      <Tabs 
        tabs={NOVEDADES_TABS} 
        activeTab={activeTab} 
        onChange={setActiveTab} 
      />

      {error && <div className={styles.errorAlert}>⚠️ {error}</div>}

      {isLoading ? (
        <div className={styles.loading}>Sincronizando incidencias...</div>
      ) : novedades.length === 0 ? (
        <div className={styles.emptyState}>
          <span>🎉</span>
          <p>Excelente trabajo. No hay novedades en esta categoría.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {novedades.map((nov) => (
            <div key={nov.id} className={`${styles.card} ${styles[nov.severity.toLowerCase()]}`}>
              <div className={styles.cardHeader}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className={`${styles.badge} ${styles[nov.severity.toLowerCase()]}`}>
                    {nov.severity}
                  </span>
                  {nov.status === 'RESOLVED' && (
                    <span style={{ fontSize: '0.65rem', background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                      RESUELTO
                    </span>
                  )}
                </div>
                <span className={styles.targetTag}>Afecta: {nov.target}</span>
              </div>

              <p className={styles.description}>{nov.description}</p>

              <div className={styles.metaInfo}>
                {nov.vehicle && <div>🚗 Vehículo: <strong>{nov.vehicle.plate}</strong></div>}
                {nov.driver && <div>👤 Conductor: <strong>{nov.driver.name}</strong></div>}
                {nov.operation && <div>📦 Viaje: <strong>{nov.operation.type} ({nov.operation.origen?.name || 'Origen'})</strong></div>}
                <div className={styles.reporter}>Reportado por: {nov.reportedBy?.name}</div>
              </div>

              {nov.status === 'RESOLVED' ? (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <strong style={{ color: '#166534' }}>Solución ({nov.resolvedBy?.name}):</strong>
                  <p style={{ margin: '4px 0 0 0', color: '#15803d' }}>{nov.resolutionNotes}</p>
                </div>
              ) : selectedForResolve === nov.id ? (
                <div className={styles.resolveBox}>
                  <textarea
                    placeholder="Escriba cómo se solucionó (Ej. Se reparó alternador en taller)..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className={styles.textarea}
                  />
                  <div className={styles.resolveActions}>
                    <button onClick={() => setSelectedForResolve(null)} className={styles.cancelBtn}>Cancelar</button>
                    <button onClick={() => handleResolveSubmit(nov.id)} className={styles.confirmResolveBtn}>
                      Cerrar y Liberar Recursos
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setSelectedForResolve(nov.id)} className={styles.resolveTriggerBtn}>
                  Resolver e Iniciar Liberación 🔓
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}