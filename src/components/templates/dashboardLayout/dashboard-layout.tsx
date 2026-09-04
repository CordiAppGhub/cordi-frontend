import React from 'react';
import { Sidebar } from '../../organisms/sidebar/sidebar';
import styles from './dashboard-layout.module.css';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
};