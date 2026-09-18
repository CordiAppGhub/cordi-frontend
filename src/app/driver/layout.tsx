'use client';

import React from 'react';
import styles from './driver-layout.module.css';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.appWrapper}>
      {/* HEADER TIPO APP */}
      <header className={styles.appHeader}>
        <button className={styles.iconBtn}>☰</button>
        <h1 className={styles.appTitle}>MI MULA</h1>
        <button className={styles.iconBtn}>🔔</button>
      </header>

      {/* CONTENIDO PRINCIPAL (Desplazable) */}
      <main className={styles.appMain}>
        {children}
      </main>

      {/* BOTTOM NAVIGATION BAR */}
      <nav className={styles.bottomNav}>
        <div className={`${styles.navItem} ${styles.active}`}>
          <span className={styles.navIcon}>🏠</span>
          <span>Inicio</span>
        </div>
        <div className={styles.navItem}>
          <span className={styles.navIcon}>📍</span>
          <span>Viaje</span>
        </div>
        <div className={styles.navItem}>
          <span className={styles.navIcon}>⚠️</span>
          <span>Novedades</span>
        </div>
        <div className={styles.navItem}>
          <span className={styles.navIcon}>📄</span>
          <span>Documentos</span>
        </div>
        <div className={styles.navItem}>
          <span className={styles.navIcon}>👤</span>
          <span>Perfil</span>
        </div>
      </nav>
    </div>
  );
}