'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Circle } from 'lucide-react';
import { Button } from '@/components/atoms/button/button';
import { authService } from '@/services/auth.services';
import { useAuthStore } from '@/store/use-auth.store';
import { PASSWORD_POLICY_REGEX } from '@/schemas/password-policy';
import { showToast } from '@/utils/alerts';
import { getUserFriendlyErrorMessage } from '@/utils/api-error';
import styles from './change-password.module.css';

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

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, setUser, logout } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!PASSWORD_POLICY_REGEX.test(newPassword)) {
      showToast.error('La nueva contraseña no cumple todos los requisitos.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast.error('Las contraseñas nuevas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authService.changePassword({
        currentPassword,
        newPassword,
      });
      setUser(response.user);
      showToast.success('Contraseña actualizada correctamente.');
      router.replace('/dashboard');
      router.refresh();
    } catch (error) {
      showToast.error(
        getUserFriendlyErrorMessage(
          error,
          'No se pudo actualizar la contraseña.',
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user) {
    return null;
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Seguridad de la cuenta</p>
        <h1 className={styles.title}>Crea tu nueva contraseña</h1>
        <p className={styles.description}>
          {user.mustChangePassword
            ? 'Por seguridad, debes reemplazar la contraseña temporal para continuar.'
            : 'Actualiza la contraseña de tu cuenta.'}
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label} htmlFor="current-password">
            Contraseña actual o temporal
          </label>
          <input
            autoComplete="current-password"
            className={styles.input}
            id="current-password"
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
            type="password"
            value={currentPassword}
          />

          <label className={styles.label} htmlFor="new-password">
            Nueva contraseña
          </label>
          <input
            autoComplete="new-password"
            className={styles.input}
            id="new-password"
            onChange={(event) => setNewPassword(event.target.value)}
            required
            type="password"
            value={newPassword}
          />

          <ul className={styles.rules} aria-label="Requisitos de la contraseña">
            {PASSWORD_RULES.map((rule) => {
              const isMet = rule.test(newPassword);
              const Icon = isMet ? Check : Circle;
              return (
                <li
                  className={isMet ? styles.ruleMet : styles.rule}
                  key={rule.label}
                >
                  <Icon aria-hidden="true" size={16} />
                  <span>{rule.label}</span>
                </li>
              );
            })}
          </ul>

          <label className={styles.label} htmlFor="confirm-password">
            Confirmar nueva contraseña
          </label>
          <input
            autoComplete="new-password"
            className={styles.input}
            id="confirm-password"
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            type="password"
            value={confirmPassword}
          />

          <Button
            className={styles.submit}
            disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
            isLoading={isSubmitting}
            type="submit"
          >
            Guardar contraseña
          </Button>
          <button
            className={styles.logout}
            onClick={() => void logout()}
            type="button"
          >
            Cerrar sesión
          </button>
        </form>
      </section>
    </main>
  );
}
