'use client';

import React from 'react';
import { StatusConfig } from '@/constants/enum-mapping-types'; 

interface StatusBadgeProps {
  status?: string | null;
  textNull?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, textNull = '--' }) => {
  if (!status) return <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{textNull}</span>;

  const config = StatusConfig[status] || {
    label: status.replace(/_/g, ' '),
    bg: '#f1f5f9',
    color: '#475569',
  };

  if (config.dot) {
    return (
      <div 
        title={config.description} 
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: config.bg,
          color: config.color,
          border: `1px solid ${config.border}`,
          padding: '4px 10px',
          borderRadius: '99px',
          fontSize: '0.7rem',
          fontWeight: 800,
          whiteSpace: 'nowrap',
          letterSpacing: '0.5px',
          cursor: config.description ? 'help' : 'default',
        }}
      >
        <span 
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: config.dot,
            boxShadow: `0 0 6px ${config.dot}90`, 
          }}
        />
        {config.label}
      </div>
    );
  }

  return (
    <span
      style={{
        backgroundColor: config.bg,
        color: config.color,
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '0.825rem',
        fontWeight: '600',
        display: 'inline-block',
        textTransform: 'capitalize',
      }}
    >
      {config.label}
    </span>
  );
};