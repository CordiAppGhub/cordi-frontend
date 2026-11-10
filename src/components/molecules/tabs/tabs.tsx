'use client';

import React from 'react';
import styles from './tabs.module.css';

export interface TabOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
  hasError?: boolean;
}

interface TabsProps {
  tabs: TabOption[];
  activeTab: string;
  onChange: (tabId: string) => void;
  fullWidth?: boolean;
}

export function Tabs({ tabs, activeTab, onChange, fullWidth = false }: TabsProps) {
  return (
    <div 
      className={`${styles.tabsContainer} ${fullWidth ? styles.fullWidth : ''}`} 
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={`${tab.label}${tab.hasError ? ", contiene errores" : ""}`}
            onClick={() => onChange(tab.id)}
            className={`${styles.tabBtn} ${isActive ? styles.activeTab : ''} ${tab.hasError ? styles.tabError : ''}`}
          >
            {tab.icon && <span className={styles.iconWrapper}>{tab.icon}</span>}
            <span className={styles.label}>{tab.label}</span>
            
            {tab.badge !== undefined && (
              <span className={`${styles.badge} ${isActive ? styles.activeBadge : ''}`}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}