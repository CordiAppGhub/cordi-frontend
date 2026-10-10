'use client';

import React from 'react';
import FleetScheduleGrid from './components/FleetScheduleGrid'; // Ajusta la ruta según donde hayas guardado el componente Grid
import styles from './programacion.module.css';

export default function FleetSchedulePage() {
  return (
    <div className={styles.page}>
      <div className={styles.schedulePanel}>
        <div className={styles.scheduleContent}>
          <FleetScheduleGrid />
        </div>
      </div>
    </div>
  );
}