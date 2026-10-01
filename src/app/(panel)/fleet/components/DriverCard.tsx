import React from 'react';
import { Star, Truck } from 'lucide-react';
import { Driver } from '@/types/drivers';
import { StatusBadge } from '@/components/atoms/badge.tsx/badge';
import styles from './fleet-cards.module.css';

interface DriverCardProps {
  driver: Driver;
  onClickDetail: (id: number) => void;
}

export const DriverCard: React.FC<DriverCardProps> = ({ driver, onClickDetail }) => {
  // Extraer iniciales de forma segura
  const initials = driver.name 
    ? driver.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
    : 'DR';

  // Obtenemos el vehículo asignado si viene en el arreglo drivenVehicles
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

    </div>
  );
};