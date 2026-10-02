// src/app/login/page.tsx (o tu ruta actual)
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthLogin } from '@/hooks/useAuth';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const {
    step,
    setStep,
    email,
    setEmail,
    password,
    setPassword,
    code,
    setCode,
    showPassword,
    setShowPassword,
    isSubmitting,
    handleLogin,
    handleVerify2FA,
  } = useAuthLogin();

  useEffect(() => {
    router.prefetch('/dashboard');
  }, [router]);

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <h1 className={styles.title}>CORDITRANS</h1>
          <p className={styles.subtitle}>
            {step === 1 ? 'Portal Administrativo (TMS)' : 'Verificación de Seguridad (2FA)'}
          </p>
        </div>

        {step === 1 ? (
      
          <form onSubmit={handleLogin} noValidate>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>Correo Electrónico</label>
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder="analista@corditrans.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  autoComplete="current-password" 
                  style={{ width: '100%', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    opacity: 0.6,
                  }}
                >
                  {showPassword ? '👁️‍🗨️' : '👁️'}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className={styles.submitBtn} 
              disabled={isSubmitting || !email.trim() || !password.trim()}
            >
              {isSubmitting ? 'Enviando código 2FA...' : 'Continuar con 2FA'}
            </button>
          </form>
        ) : (
   
          <form onSubmit={handleVerify2FA} noValidate>
            <div className={styles.formGroup}>
              <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', marginBottom: '16px' }}>
                Hemos enviado un código de verificación de 6 dígitos a <b>{email}</b>. Revisa tu bandeja de entrada o spam.
              </p>
              
              <label htmlFor="code" className={styles.label} style={{ textAlign: 'center' }}>
                Código de Verificación (OTP)
              </label>
              <input
                id="code"
                type="text"
                maxLength={6}
                className={styles.input}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
                disabled={isSubmitting}
                autoFocus
                style={{
                  textAlign: 'center',
                  fontSize: '1.5rem',
                  letterSpacing: '0.3em',
                  fontWeight: 'bold',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                style={{
                  width: '35%',
                  padding: '12px',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: '#475569',
                }}
              >
                Volver
              </button>
              <button 
                type="submit" 
                className={styles.submitBtn} 
                style={{ width: '65%', margin: 0 }}
                disabled={isSubmitting || code.length < 6}
              >
                {isSubmitting ? 'Validando...' : 'Verificar y Entrar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}