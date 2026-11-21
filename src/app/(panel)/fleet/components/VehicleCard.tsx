import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Link2,
  Pencil,
  Unplug,
  UserRound,
} from 'lucide-react';
import type { Vehicle } from '@/types/vehicles';
import { TRAILER_TYPE_LABELS } from '@/types/vehicles';
import { StatusBadge } from '@/components/atoms/badge.tsx/badge';
import { Button } from '@/components/atoms/button/button';
import { resolveFleetUnitConfiguration } from '@/utils/fleet-configuration';
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

type ExpirationState = 'valid' | 'missing' | 'expired';

function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getExpirationState(expiration: string | null): ExpirationState {
  if (!expiration) return 'missing';
  return expiration.slice(0, 10) < getLocalDateString(new Date())
    ? 'expired'
    : 'valid';
}

function formatDate(expiration: string): string {
  const [year, month, day] = expiration.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

function formatKilograms(value: number): string {
  return value.toLocaleString('es-CO');
}

function ExpirationDocument({
  label,
  expiration,
}: {
  label: string;
  expiration: string | null;
}) {
  const state = getExpirationState(expiration);
  const statusLabel =
    state === 'missing'
      ? 'Sin registrar'
      : state === 'expired'
        ? `Vencido · ${formatDate(expiration ?? '')}`
        : formatDate(expiration ?? '');
  const icon =
    state === 'valid' ? (
      <CheckCircle2 size={14} aria-hidden="true" />
    ) : state === 'expired' ? (
      <Clock size={14} aria-hidden="true" />
    ) : (
      <AlertCircle size={14} aria-hidden="true" />
    );

  return (
    <div className={`${styles.docItem} ${styles[`doc${state}`]}`}>
      {icon}
      <span>
        {label}: {statusLabel}
      </span>
    </div>
  );
}

export const VehicleCard = ({
  vehicle,
  driverName,
  onClickEdit,
  onAssignDriver,
  onUnassignDriver,
  onCoupleTrailer,
  onUncoupleTrailer,
}: VehicleCardProps) => {
  const configuration = resolveFleetUnitConfiguration(vehicle);
  const referenceTypology =
    vehicle.type === 'MULA' ? '3S3' : vehicle.type === 'PATINETA' ? '2S3' : null;
  const trailerTypeLabel = vehicle.currentTrailer?.trailerType
    ? TRAILER_TYPE_LABELS[vehicle.currentTrailer.trailerType]
    : 'Tipo sin registrar';

  return (
    <div
      className={styles.cardContainer}
      onClick={() => onClickEdit(vehicle.id)}
    >
      <div className={styles.cardHeader}>
        <div className={styles.titleGroup}>
          <div className={styles.mainTitle}>
            <span>{vehicle.plate}</span>
            <span className={styles.brandBadge}>
              {vehicle.brand || 'N/A'} {vehicle.modelYear || ''}
            </span>
            {configuration.typologyCode ? (
              <span className={styles.typologyBadge}>
                {configuration.typologyCode}
              </span>
            ) : (
              <span className={styles.incompleteBadge}>
                {configuration.hasTrailer ? 'Ejes inválidos' : 'Sin chasis'}
              </span>
            )}
          </div>
          <span className={styles.subTitle}>
            {vehicle.affiliation || 'Sin afiliación asignada'}
          </span>
        </div>
        <div className={styles.cardHeaderActions}>
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

      <div className={styles.metricsBox}>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Capacidad útil</span>
          <span className={styles.metricValue}>
            {formatKilograms(configuration.effectivePayloadKg)} kg
            {!configuration.hasTrailer &&
              !configuration.isRigid &&
              referenceTypology &&
              ` (máx. ref. ${referenceTypology})`}
          </span>
          <div className={styles.metricSubtext}>
            {configuration.maxLegalPbvKg !== null && (
              <span>
                PBV Legal: {formatKilograms(configuration.maxLegalPbvKg)} kg
              </span>
            )}
            {configuration.effectivePayloadKg !==
              configuration.baseTractorPayloadKg && (
              <span>
                Base cabezote:{' '}
                {formatKilograms(configuration.baseTractorPayloadKg)} kg
              </span>
            )}
            <span>{configuration.limitingFactorLabel}</span>
          </div>
        </div>

        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Ejes del conjunto</span>
          <span className={`${styles.metricValue} ${styles.metricHighlight}`}>
            {configuration.hasTrailer && configuration.trailerAxles !== null
              ? `${configuration.totalAxles} ejes`
              : `${configuration.tractorAxles} ejes`}
          </span>
          <span className={styles.metricSubtext}>
            {configuration.hasTrailer && configuration.trailerAxles !== null
              ? `${configuration.tractorAxles} cabezote + ${configuration.trailerAxles} chasis`
              : configuration.isRigid
                ? 'Rígido sin chasis'
                : `${configuration.tractorAxles} ejes (cabezote)`}
          </span>
        </div>

        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Conductor</span>
          <span
            className={`${styles.metricValue} ${driverName ? '' : styles.mutedValue}`}
          >
            {driverName || 'Sin asignar'}
          </span>
        </div>

        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Chasis acoplado</span>
          {configuration.hasTrailer ? (
            <>
              <strong className={styles.metricValue}>
                {vehicle.currentTrailer?.plate || 'Sin placa'}
              </strong>
              <span className={styles.metricSubtext}>
                {configuration.trailerAxles ?? '--'} ejes · {trailerTypeLabel}
              </span>
            </>
          ) : (
            <span className={styles.metricValue}>
              {configuration.isRigid ? 'No aplica (Rígido)' : 'Sin acoplar'}
            </span>
          )}
        </div>
      </div>

      <div className={styles.docsSection}>
        <div className={styles.docsTitle}>Documentos Portuarios:</div>
        <div className={styles.docsGrid}>
          <ExpirationDocument
            label="SOAT"
            expiration={vehicle.soatExpiration}
          />
          <ExpirationDocument
            label="Tecnomecánica"
            expiration={vehicle.tecnoExpiration}
          />
          <div className={`${styles.docItem} ${styles.docmissing}`}>
            <AlertCircle size={14} aria-hidden="true" />
            <span>Póliza carga: Sin registrar</span>
          </div>
          <div className={`${styles.docItem} ${styles.docvalid}`}>
            <CheckCircle2 size={14} aria-hidden="true" />
            <span>BAPLIE: Vigente</span>
          </div>
        </div>
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.actionButtons}>
          {driverName ? (
            <Button
              type="button"
              variant="secondary"
              className={styles.actionButton}
              onClick={(event) => {
                event.stopPropagation();
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
              onClick={(event) => {
                event.stopPropagation();
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
            onClick={(event) => {
              event.stopPropagation();
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
