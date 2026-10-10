'use client';

import styles from './truck-loader.module.css';

interface TruckLoaderProps {
  message: string;
  variant?: 'section' | 'page' | 'compact';
}

export function TruckLoader({
  message,
  variant = 'section',
}: TruckLoaderProps) {
  return (
    <div
      className={`${styles.container} ${styles[variant]}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className={styles.visual} aria-hidden="true">
        <div className={styles.truckContainer}>
          <svg viewBox="0 0 120 70" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="10" width="75" height="45" rx="3" fill="#1e293b" />
            <line x1="25" y1="10" x2="25" y2="55" stroke="#334155" strokeWidth="2" />
            <line x1="45" y1="10" x2="45" y2="55" stroke="#334155" strokeWidth="2" />
            <line x1="65" y1="10" x2="65" y2="55" stroke="#334155" strokeWidth="2" />
            <path d="M85 25h15l12 15v15H85V25z" fill="#2563eb" />
            <path d="M100 28h8l7 10h-15V28z" fill="#bae6fd" />
            <g className={styles.wheel} style={{ transformOrigin: '20px 58px' }}>
              <circle cx="20" cy="58" r="7" fill="#0f172a" />
              <circle cx="20" cy="58" r="3" fill="#cbd5e1" />
            </g>
            <g className={styles.wheel} style={{ transformOrigin: '40px 58px' }}>
              <circle cx="40" cy="58" r="7" fill="#0f172a" />
              <circle cx="40" cy="58" r="3" fill="#cbd5e1" />
            </g>
            <g className={styles.wheel} style={{ transformOrigin: '92px 58px' }}>
              <circle cx="92" cy="58" r="7" fill="#0f172a" />
              <circle cx="92" cy="58" r="3" fill="#cbd5e1" />
            </g>
            <g className={styles.wheel} style={{ transformOrigin: '108px 58px' }}>
              <circle cx="108" cy="58" r="7" fill="#0f172a" />
              <circle cx="108" cy="58" r="3" fill="#cbd5e1" />
            </g>
          </svg>
        </div>
        <div className={styles.road}>
          <div className={styles.roadLine} />
        </div>
      </div>
      <div className={styles.copy}>
        <span className={styles.eyebrow}>CORDITRANS · EN LÍNEA</span>
        <p className={styles.message}>{message}</p>
      </div>
    </div>
  );
}
