import React from 'react';
import { CheckCircle2, Link2, Pencil, Unplug, UserRound } from 'lucide-react';
import { Vehicle } from '@/types/vehicles';
import { StatusBadge } from '@/components/atoms/badge.tsx/badge';
import { Button } from '@/components/atoms/button/button';
import styles from './fleet-cards.module.css';

interface VehicleCardProps {
  vehicle: Vehicle;
  driverName: string | null;
  onClickEdit: (id: number) => void;
  onAssignDriver: () => void;
  onUnassignDriver: () => void;
  onCoupleTrailer: () => void;
  onUncoupleTrailer: () => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  driverName,
  onClickEdit,
  onAssignDriver,
  onUnassignDriver,
  onCoupleTrailer,
  onUncoupleTrailer,
}) => {
  return (
    <div className={styles.cardContainer} onClick={() => onClickEdit(vehicle.id)}>
      
      {/* 1. CABECERA */}
      <div className={styles.cardHeader}>
        <div className={styles.titleGroup}>
          <div className={styles.mainTitle}>
            {vehicle.plate} 
            <span className={styles.brandBadge}>{vehicle.brand || 'N/A'} {vehicle.modelYear || ''}</span>
          </div>
          <span className={styles.subTitle}>{vehicle.affiliation || 'Sin afiliación asignada'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusBadge status={vehicle.status} />
          <Button
            type="button"
            variant="secondary"
            aria-label={`Editar cabezote ${vehicle.plate}`}
            onClick={(event) => {
              event.stopPropagation();
              onClickEdit(vehicle.id);
            }}
            style={{ padding: '6px 8px' }}
          >
            <Pencil size={15} />
          </Button>
        </div>
      </div>

      {/* 2. MÉTRICAS (Fondo gris tenue y borde interno) */}
      <div className={styles.metricsBox}>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Capacidad</span>
          <span className={styles.metricValue}>
            {vehicle.cargoCapacity ? `${vehicle.cargoCapacity.toLocaleString()} kg` : '--'}
          </span>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Eficiencia</span>
          <span className={`${styles.metricValue} ${styles.metricHighlight}`}>11.2 km/gal</span>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Conductor</span>
          <span className={styles.metricValue} style={{ color: driverName ? '#0f172a' : '#94a3b8' }}>
            {driverName || 'Sin asignar'}
          </span>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Chasis Acoplado</span>
          <span className={styles.metricValue}>
            {vehicle.currentTrailer?.plate || '--'}
          </span>
        </div>
      </div>

      {/* 3. DOCUMENTOS (Separados por línea superior) */}
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

      {/* 4. FOOTER (Fondo diferente para separar acciones) */}
      <div className={styles.cardFooter}>
        <div className={styles.actionButtons}>
          {driverName ? (
            <Button
              type="button"
              variant="secondary"
              className={styles.actionButton}
              onClick={(e) => {
                e.stopPropagation();
                onUnassignDriver();
              }}
            >
              <UserRound size={15} aria-hidden="true" />
              Liberar
            </Button>
          ) : vehicle.ownershipType === 'PROPIO' ? (
            <Button
              type="button"
              variant="secondary"
              className={styles.actionButton}
              onClick={(e) => {
                e.stopPropagation();
                onAssignDriver();
              }}
            >
              <UserRound size={15} aria-hidden="true" />
              Asignar Conductor
            </Button>
          ) : (
            <span className={styles.assignmentNotice}>
              Se asigna desde la operación
            </span>
          )}
          <Button
            type="button"
            variant={vehicle.currentTrailerId ? 'secondary' : 'primary'}
            className={`${styles.actionButton} ${vehicle.currentTrailerId ? styles.uncoupleButton : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (vehicle.currentTrailerId) {
                onUncoupleTrailer();
              } else {
                onCoupleTrailer();
              }
            }}
          >
            {vehicle.currentTrailerId ? (
              <Unplug size={15} aria-hidden="true" />
            ) : (
              <Link2 size={15} aria-hidden="true" />
            )}
            {vehicle.currentTrailerId ? 'Desenganchar' : 'Acoplar Chasis'}
          </Button>
        </div>
      </div>

    </div>
  );
};