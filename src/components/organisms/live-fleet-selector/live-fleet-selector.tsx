'use client';

import { Button } from '@/components/atoms/button/button';
import { useFleetLive } from '@/hooks/use-fleet-live';
import type {
  FleetLiveStatus,
  FleetLiveTrailer,
  FleetLiveVehicle,
} from '@/services/fleet-live.service';
import styles from './live-fleet-selector.module.css';

const labels: Record<FleetLiveStatus, string> = {
  AVAILABLE: 'Disponible',
  ENDING_SOON: 'Por finalizar',
  BUSY: 'Ocupado',
  UNAVAILABLE: 'No disponible',
};

const selectableStatuses: FleetLiveStatus[] = ['AVAILABLE', 'ENDING_SOON'];

const formatAppointment = (value: string | null) =>
  value ? `Cita: ${new Date(value).toLocaleString('es-CO')}` : null;

interface LiveFleetSelectorProps {
  selectedVehicleId?: number | null;
  onSelectVehicle?: (vehicle: FleetLiveVehicle) => void;
  canSelectVehicle?: (vehicle: FleetLiveVehicle) => boolean;
  isSubmitting?: boolean;
}

export function LiveFleetSelector({
  selectedVehicleId,
  onSelectVehicle,
  canSelectVehicle,
  isSubmitting = false,
}: LiveFleetSelectorProps) {
  const query = useFleetLive();

  if (query.isLoading) return <p role="status">Cargando flota...</p>;
  if (query.isError || !query.data) {
    return (
      <div role="alert" className={styles.error}>
        No se pudo cargar la disponibilidad.
        <Button variant="secondary" type="button" onClick={() => void query.refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  const { vehicles, trailers } = query.data;

  const vehicleTitle = (vehicle: FleetLiveVehicle) =>
    [
      labels[vehicle.status],
      vehicle.ownershipType === 'TERCERO' ? 'Vehículo externo' : null,
      !vehicle.driverId ? 'Sin conductor' : null,
      !vehicle.trailerId ? 'Sin tráiler' : null,
      formatAppointment(vehicle.appointmentAt),
    ]
      .filter(Boolean)
      .join(' · ');

  const trailerTitle = (trailer: FleetLiveTrailer) =>
    [
      labels[trailer.status],
      trailer.coupledVehicle ? `Acoplado a ${trailer.coupledVehicle.plate}` : null,
      formatAppointment(trailer.appointmentAt),
    ]
      .filter(Boolean)
      .join(' · ');

  return (
    <section className={styles.panel} aria-label="Disponibilidad de la flota">
      <p className={styles.legend}>
        <span className={`${styles.dot} ${styles.AVAILABLE}`} /> Disponible
        <span className={`${styles.dot} ${styles.ENDING_SOON}`} /> Por finalizar
        <span className={`${styles.dot} ${styles.BUSY}`} /> Ocupado
      </p>
      <p className={styles.hint}>
        La disponibilidad no garantiza que el conductor esté habilitado para una nueva operación.
      </p>

      <h3 className={styles.heading}>Cabezotes ({vehicles.length})</h3>
      <div className={styles.grid}>
        {vehicles.map((vehicle) => {
          const selectable =
            Boolean(onSelectVehicle) &&
            !isSubmitting &&
            selectableStatuses.includes(vehicle.status) &&
            (!canSelectVehicle || canSelectVehicle(vehicle));
          return (
            <Button
              key={vehicle.id}
              variant="secondary"
              type="button"
              className={`${styles.pill} ${
                selectedVehicleId === vehicle.id ? styles.pillSelected : ''
              }`}
              aria-pressed={selectedVehicleId === vehicle.id}
              title={vehicleTitle(vehicle)}
              disabled={!selectable}
              onClick={() => onSelectVehicle?.(vehicle)}
            >
              <span className={`${styles.dot} ${styles[vehicle.status]}`} />
              {vehicle.plate}
            </Button>
          );
        })}
      </div>

      <h3 className={styles.heading}>Tráilers ({trailers.length})</h3>
      <div className={styles.grid}>
        {trailers.map((trailer) => (
          <Button
            key={trailer.id}
            variant="secondary"
            type="button"
            className={`${styles.pill} ${styles.pillReadonly}`}
            title={trailerTitle(trailer)}
            tabIndex={-1}
            aria-disabled="true"
          >
            <span className={`${styles.dot} ${styles[trailer.status]}`} />
            {trailer.plate}
          </Button>
        ))}
      </div>
    </section>
  );
}
