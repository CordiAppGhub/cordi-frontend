import React from 'react';
import styles from './driver-layout.module.css';

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.driverLayoutContainer}>
      {/* Aquí puedes poner una barra superior limpia y minimalista exclusiva para conductores */}
      <header className={styles.driverHeader}>
        <span className={styles.brand}>🚚 Corditrans - Portal de Conductores</span>
      </header>
      
      <main className={styles.driverMain}>
        {children}
      </main>
    </div>
  );
}