'use client';

import React from 'react';
import { Button } from '@/components/atoms/button/button';
import styles from '../driver.module.css';

interface DriverAuthSectionProps {
  authStep: 'CEDULA' | 'OTP';
  authError: string | null;
  cedulaInput: string;
  setCedulaInput: (val: string) => void;
  otpInput: string;
  setOtpInput: (val: string) => void;
  onCedulaSubmit: (e: React.FormEvent) => void;
  onOtpSubmit: (e: React.FormEvent) => void;
  onBackToCedula: () => void;
}

export function DriverAuthSection({
  authStep,
  authError,
  cedulaInput,
  setCedulaInput,
  otpInput,
  setOtpInput,
  onCedulaSubmit,
  onOtpSubmit,
  onBackToCedula,
}: DriverAuthSectionProps) {
  return (
    <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
      <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <span className={styles.badge} style={{ marginBottom: '12px', display: 'inline-block' }}>Portal del Conductor</span>
        
        {authError && (
          <div style={{ color: '#dc2626', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
            {authError}
          </div>
        )}

        {authStep === 'CEDULA' ? (
          <form onSubmit={onCedulaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input 
              type="text" 
              placeholder="Número de cédula"
              value={cedulaInput}
              onChange={(e) => setCedulaInput(e.target.value)}
              required
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', width: '100%', textAlign: 'center' }}
            />
            <Button variant="primary" type="submit" style={{ padding: '12px', fontSize: '1rem' }}>Continuar</Button>
          </form>
        ) : (
          <form onSubmit={onOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input 
              type="text" 
              placeholder="123456"
              maxLength={6}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              required
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1.5rem', letterSpacing: '8px', textAlign: 'center', fontWeight: 'bold' }}
            />
            <Button variant="primary" type="submit" style={{ padding: '12px', fontSize: '1rem', backgroundColor: '#059669' }}>Ingresar</Button>
            <button type="button" onClick={onBackToCedula} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.85rem', textDecoration: 'underline', cursor: 'pointer' }}>
              Volver e intentar de nuevo
            </button>
          </form>
        )}
      </div>
    </div>
  );
}