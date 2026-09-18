import React from 'react';
import { StatusConfig } from '@/constants/enum-mapping-types';

interface StatusBadgeProps {
  status?: string | null;
  textNull?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, textNull }) => {
  if (!status) return <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{textNull}</span>;

  const config = StatusConfig[status] || {
    label: status.replace(/_/g, ' '),
    bg: '#f1f5f9',
    color: '#475569',
  };

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