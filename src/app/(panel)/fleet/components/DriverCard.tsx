import React from 'react';
import { Star, Truck, Pencil, Trash2 } from 'lucide-react';
import { Driver } from '@/types/drivers';
import { StatusBadge } from '@/components/atoms/badge.tsx/badge';
import styles from './fleet-cards.module.css';

interface DriverCardProps {
  driver: Driver;
  onClickDetail: (id: number) => void;
  onEdit?: (driver: Driver) => void;
  onDelete?: (id: number, name: string | null) => void;
}

export const DriverCard: React.FC<DriverCardProps> = ({
  driver,
  onClickDetail,
  onEdit,
  onDelete,
}) => {
  const initials = driver.name 
    ? driver.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
    : 'DR';

  const assignedVehicle = driver.drivenVehicles && driver.drivenVehicles.length > 0 
    ? driver.drivenVehicles[0].plate 
    : null;

  return (
    <div className={styles.card} onClick={() => onClickDetail(driver.id)} style={{ cursor: 'pointer' }}>
      
      <div className={styles.cardHeader}>
        <div className={styles.avatarWrapper}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.titleGroup}>
            <div className={styles.mainTitle} style={{ fontSize: '1.1rem' }}>
              {driver.name || 'Sin nombre'}
            </div>
            <span className={styles.subTitle} style={{ textTransform: 'none' }}>
              Lic: C3 • CC {driver.cedula || 'N/A'}
            </span>
          </div>
        </div>
        <StatusBadge status={driver.isAvailable ? 'AVAILABLE' : 'BUSY'} />
      </div>

      <div className={styles.metricsBox} style={{ gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center' }}>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Rating</span>
          <span className={`${styles.metricValue} ${styles.metricHighlight}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <Star size={14} fill="currentColor" /> 4.9
          </span>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Eco Score</span>
          <span className={styles.metricValue} style={{ color: '#16a34a' }}>94/100</span>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Puntualidad</span>
          <span className={styles.metricValue}>99.1%</span>
        </div>
      </div>

      <div className={styles.docsSection} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', alignItems: 'center' }}>
          <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Truck size={14} /> Vehículo Asignado:
          </span>
          <span style={{ fontWeight: '600', color: assignedVehicle ? '#2563eb' : '#94a3b8' }}>
            {assignedVehicle ? `${assignedVehicle}` : 'Ninguno'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <span style={{ color: '#64748b' }}>Credencial Portuaria:</span>
          <span style={{ fontWeight: '600', color: '#16a34a' }}>Vence 2027-04-30</span>
        </div>
      </div>

      {/* Botones de acción rápida */}
      {(onEdit || onDelete) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            paddingTop: '10px',
            borderTop: '1px solid #f1f5f9',
            marginTop: '4px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {onEdit && (
            <button
              type="button"
              title="Editar conductor"
              onClick={() => onEdit(driver)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                color: '#334155',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Pencil size={13} color="#2563eb" /> Editar
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              title="Eliminar conductor"
              onClick={() => onDelete(driver.id, driver.name)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid #fee2e2',
                backgroundColor: '#fff5f5',
                color: '#dc2626',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Trash2 size={13} color="#dc2626" /> Eliminar
            </button>
          )}
        </div>
      )}

    </div>
  );
};