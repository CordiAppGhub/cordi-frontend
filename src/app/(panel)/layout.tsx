import React from 'react';
import { Navbar } from '@/components/organisms/navbar/Navbar';
import styles from './layout.module.css';

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.panelWrapper}>
      <Navbar />




      <main className={styles.mainContent}>
        {children}
      </main>

    </div>
  );
}