import React from 'react';
import styles from './settings.module.css';

export default function SettingsPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        Configuración del Sistema
      </h1>
      <p className={styles.description}>Configuraciones de la API, roles y accesos...</p>
    </div>
  );
}