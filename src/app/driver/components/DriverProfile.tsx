'use client';

import { BadgeCheck, IdCard, Phone, Truck, UserRound } from 'lucide-react';
import { DriverPortalData } from '@/types/driver-portal.types';
import styles from './driver-profile.module.css';

function ProfileField({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldIcon}>
        <Icon size={18} />
      </span>
      <span className={styles.fieldText}>
        <small>{label}</small>
        <strong>{value || 'No registrado'}</strong>
      </span>
    </div>
  );
}

export function DriverProfile({ driver }: { driver: DriverPortalData }) {
  const vehicles = driver.drivenVehicles ?? [];

  return (
    <section className={styles.profile}>
      <header className={styles.header}>
        <span className={styles.avatar}>
          <UserRound size={28} />
        </span>
        <div>
          <p className={styles.eyebrow}>Mi cuenta</p>
          <h2>{driver.name || 'Conductor'}</h2>
          <span className={driver.isActive ? styles.active : styles.inactive}>
            <BadgeCheck size={14} />
            {driver.isActive ? 'Perfil activo' : 'Perfil inactivo'}
          </span>
        </div>
      </header>

      <div className={styles.fields}>
        <ProfileField icon={IdCard} label="Cédula" value={driver.cedula} />
        <ProfileField icon={Phone} label="Teléfono" value={driver.telefono || ''} />
      </div>

      <section className={styles.vehicles}>
        <div className={styles.sectionHeader}>
          <Truck size={18} />
          <h3>Mis vehículos</h3>
          <span>{vehicles.length}</span>
        </div>
        {vehicles.length ? (
          <ul>
            {vehicles.map((vehicle) => (
              <li key={vehicle.id}>
                <strong>{vehicle.plate}</strong>
                <span>{vehicle.type?.replace(/_/g, ' ') || 'Vehículo asignado'}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>No tienes vehículos asignados.</p>
        )}
      </section>
    </section>
  );
}
