'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/use-auth.store';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    router.prefetch('/dashboard');
  }, [router]);

 const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('⏳ 1. Enviando datos al store...');
      
      await login(email, password);
      
      console.log('✅ 2. Store respondió OK. El token debe estar guardado.');
      console.log('🚀 3. Ejecutando router.replace...');
      
      router.replace('/dashboard');
      
      console.log('🏁 4. Redirección lanzada.');
    } catch (err: unknown) {
      console.error('❌ Error capturado en el catch:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado conectando con el servidor.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <h1 className={styles.title}>CORDITRANS</h1>
          <p className={styles.subtitle}>Portal Administrativo (TMS)</p>
        </div>

        {error && (
          <div className={styles.errorMessage} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
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
            {isSubmitting ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}