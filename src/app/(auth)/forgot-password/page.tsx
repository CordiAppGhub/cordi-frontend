'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Check, Circle } from 'lucide-react';
import { Button } from '@/components/atoms/button/button';
import { authService } from '@/services/auth.services';
import { PASSWORD_POLICY_REGEX } from '@/schemas/password-policy';
import { showToast } from '@/utils/alerts';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';
import styles from '../login/login.module.css';

const PASSWORD_RULES = [
  { label: 'Al menos 12 caracteres', test: (value: string) => value.length >= 12 },
  { label: 'Una letra mayúscula', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'Una letra minúscula', test: (value: string) => /[a-z]/.test(value) },
  { label: 'Un número', test: (value: string) => /\d/.test(value) },
  {
    label: 'Un símbolo y ningún espacio',
    test: (value: string) =>
      /[^A-Za-z0-9\s]/.test(value) && !/\s/.test(value),
  },
];

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeRequested, setCodeRequested] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await authService.requestPasswordReset(email.trim());
      showToast.success(response.message);
      setCodeRequested(true);
    } catch (error: unknown) {
      showToast.error(
        getUserFriendlyErrorMessage(
          error,
          'No se pudo solicitar el código. Inténtalo más tarde.',
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!PASSWORD_POLICY_REGEX.test(newPassword)) {
      showToast.error('La contraseña no cumple todos los requisitos.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast.error('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authService.resetPassword({
        email: email.trim(),
        code,
        newPassword,
      });
      showToast.success(response.message);
      window.location.replace('/login');
    } catch (error: unknown) {
      showToast.error(
        getUserFriendlyErrorMessage(
          error,
          'No se pudo actualizar la contraseña. Verifica el código e inténtalo nuevamente.',
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.loginContainer}>
      <section className={styles.loginCard}>
        <header className={styles.loginHeader}>
          <h1 className={styles.title}>Recuperar contraseña</h1>
          <p className={styles.subtitle}>Seguridad de la cuenta</p>
        </header>

        {!codeRequested ? (
          <form onSubmit={requestCode} noValidate>
            <p className={styles.helperText}>
              Ingresa el correo de tu cuenta. Si está activa, enviaremos un
              código de verificación válido por 10 minutos.
            </p>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="recovery-email">
                Correo electrónico
              </label>
              <input
                autoComplete="email"
                autoFocus
                className={styles.input}
                disabled={isSubmitting}
                id="recovery-email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </div>
            <Button
              className={styles.submitBtn}
              disabled={isSubmitting || !email.trim()}
              isLoading={isSubmitting}
              type="submit"
            >
              Enviar código
            </Button>
          </form>
        ) : (
          <form onSubmit={resetPassword} noValidate>
            <p className={styles.helperText}>
              Si el correo corresponde a una cuenta activa, recibirás un código
              en <strong>{email}</strong>. El código vence en 10 minutos.
            </p>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="recovery-code">
                Código de 6 dígitos
              </label>
              <input
                autoComplete="one-time-code"
                autoFocus
                className={styles.input}
                disabled={isSubmitting}
                id="recovery-code"
                inputMode="numeric"
                maxLength={6}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                }
                required
                value={code}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="new-password">
                Nueva contraseña
              </label>
              <input
                autoComplete="new-password"
                className={styles.input}
                disabled={isSubmitting}
                id="new-password"
                onChange={(event) => setNewPassword(event.target.value)}
                required
                type="password"
                value={newPassword}
              />
            </div>
            <ul className={styles.passwordRules} aria-label="Requisitos de contraseña">
              {PASSWORD_RULES.map((rule) => {
                const isMet = rule.test(newPassword);
                const Icon = isMet ? Check : Circle;
                return (
                  <li
                    className={isMet ? styles.passwordRuleMet : styles.passwordRule}
                    key={rule.label}
                  >
                    <Icon aria-hidden="true" size={15} />
                    <span>{rule.label}</span>
                  </li>
                );
              })}
            </ul>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="confirm-password">
                Confirmar nueva contraseña
              </label>
              <input
                autoComplete="new-password"
                className={styles.input}
                disabled={isSubmitting}
                id="confirm-password"
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                type="password"
                value={confirmPassword}
              />
            </div>
            <Button
              className={styles.submitBtn}
              disabled={
                isSubmitting ||
                code.length !== 6 ||
                !newPassword ||
                !confirmPassword
              }
              isLoading={isSubmitting}
              type="submit"
            >
              Cambiar contraseña
            </Button>
            <button
              className={styles.backLink}
              disabled={isSubmitting}
              onClick={() => {
                setCodeRequested(false);
                setCode('');
              }}
              type="button"
            >
              Cambiar correo
            </button>
          </form>
        )}

        <Link className={styles.backLink} href="/login">
          Volver al inicio de sesión
        </Link>
      </section>
    </main>
  );
}
