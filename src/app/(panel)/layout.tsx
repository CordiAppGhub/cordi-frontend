import React from 'react';
import { Sidebar } from '@/components/organisms/sidebar/sidebar';
import styles from './layout.module.css';

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.panelWrapper}>
      {/* El Sidebar se renderiza una sola vez para todas las rutas privadas */}
      <Sidebar />
      
      {/* Aquí Next.js inyectará la página en la que estés (dashboard, operaciones, etc) */}
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}