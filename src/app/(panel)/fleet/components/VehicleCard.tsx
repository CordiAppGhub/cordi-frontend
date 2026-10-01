import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Vehicle } from '@/types/vehicles';
import { StatusBadge } from '@/components/atoms/badge.tsx/badge';
import styles from './fleet-cards.module.css';

interface VehicleCardProps {
  vehicle: Vehicle;
  onClickEdit: (id: number) => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onClickEdit }) => {
  return (
    <div className={styles.card} onClick={() => onClickEdit(vehicle.id)} style={{ cursor: 'pointer' }}>
      
      <div className={styles.cardHeader}>
        <div className={styles.titleGroup}>
          <div className={styles.mainTitle}>
            {vehicle.plate} 
            <span className={styles.brandBadge}>{vehicle.brand || 'N/A'} {vehicle.modelYear || ''}</span>
          </div>
          <span className={styles.subTitle}>{vehicle.empresa || 'Sin empresa asignada'}</span>
        </div>
        <StatusBadge status={vehicle.status} />
      </div>

      <div className={styles.metricsBox}>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Capacidad</span>
          <span className={styles.metricValue}>
            {vehicle.capacityWeight ? `${vehicle.capacityWeight.toLocaleString()} kg` : '--'}
          </span>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Eficiencia</span>
          <span className={`${styles.metricValue} ${styles.metricHighlight}`}>11.2 km/gal</span>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Conductor</span>
          {/* 👇 AQUÍ MOSTRAMOS EL CONDUCTOR REAL DEL BACKEND */}
          <span className={styles.metricValue} style={{ color: vehicle.driver ? '#0f172a' : '#94a3b8' }}>
            {vehicle.driver ? vehicle.driver.name : 'Sin asignar'}
          </span>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Chasis Acoplado</span>
          <span className={styles.metricValue}>--</span>
        </div>
      </div>

      <div className={styles.docsSection}>
        <div className={styles.docsTitle}>Documentos Portuarios:</div>
        <div className={styles.docsGrid}>
          <div className={styles.docItem}>
             <CheckCircle2 size={14} /> 
             {vehicle.soatExpiration ? `SOAT: ${new Date(vehicle.soatExpiration).toLocaleDateString()}` : 'SOAT: Sin registrar'}
          </div>
          <div className={styles.docItem}>
             <CheckCircle2 size={14} /> 
             {vehicle.tecnoExpiration ? `Tecno: ${new Date(vehicle.tecnoExpiration).toLocaleDateString()}` : 'Tecno: Sin registrar'}
          </div>
          <div className={styles.docItem}>
             <CheckCircle2 size={14} /> Póliza Carga
          </div>
          <div className={styles.docItem} style={{ color: '#2563eb' }}>
             <CheckCircle2 size={14} /> BAPLIE: Vigente
          </div>
        </div>
      </div>

    </div>
  );
};