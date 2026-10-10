'use client';

import React from 'react';
import QueryProvider from '@/providers/query-provider';
import styles from './driver-layout.module.css';
import { DriverAuthProvider } from '@/providers/authDriverProvider';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <DriverAuthProvider>
        <div className={styles.appWrapper}>
          <header className={styles.appHeader}>
            <h1 className={styles.appTitle}>MI MULA</h1>
          </header>

          <main className={styles.appMain}>
            {children}
          </main>
        </div>
      </DriverAuthProvider>
    </QueryProvider>
  );
}