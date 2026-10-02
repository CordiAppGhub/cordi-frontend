'use client';

import React from 'react';

interface HistoryTabProps {
  history: any[];
  loadingHistory: boolean;
}

export function HistoryTab({ history, loadingHistory }: HistoryTabProps) {
  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>Trazabilidad y Rendimiento</h2>
      <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '0.9rem' }}>Consulta el histórico de tus servicios y el dinero asignado por cada viaje.</p>

      {loadingHistory ? (
        <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>Cargando historial...</p>
      ) : history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px' }}>
          <p style={{ color: '#64748b' }}>No tienes servicios registrados en el historial.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {history.map((op: any) => (
            <div 
              key={op.id} 
              style={{ 
                backgroundColor: 'white', 
                padding: '16px', 
                borderRadius: '12px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                borderLeft: op.status === 'FINALIZADO' ? '4px solid #059669' : '4px solid #f59e0b',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 'bold', color: '#1e293b' }}>Viaje #{op.id} ({op.type})</span>
                  <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '999px', backgroundColor: op.status === 'FINALIZADO' ? '#d1fae5' : '#fef3c7', color: op.status === 'FINALIZADO' ? '#065f46' : '#92400e', fontWeight: 'bold' }}>
                    {op.status}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#475569', margin: '2px 0' }}>🏢 <strong>Cliente:</strong> {op.clientName}</p>
                <p style={{ fontSize: '0.85rem', color: '#475569', margin: '2px 0' }}>📍 <strong>Ruta:</strong> {op.origenName} ➡️ {op.destinoName}</p>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>📅 Creado: {new Date(op.createdAt).toLocaleDateString()}</span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Tu Pago</span>
                <strong style={{ fontSize: '1.2rem', color: '#059669' }}>
                  ${Number(op.fletePago || 0).toLocaleString('es-CO')}
                </strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}