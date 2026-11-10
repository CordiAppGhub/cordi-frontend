'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.services';
import { useAuthStore } from '@/store/use-auth.store';
import { showToast } from '@/utils/alerts';

export function useAuthLogin() {
  const [step, setStep] = useState<1 | 2>(1); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState(''); 
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: () => authService.loginStepOne(email, password),
    onSuccess: (data) => {
      if (data?.requires2FA) {
        showToast.success('¡Credenciales correctas! Código enviado a tu correo.');
        setStep(2);
      }
    },
    onError: (err: unknown) => {
      showToast.error(
        err,
        'No pudimos iniciar sesión. Revisa tus datos e inténtalo de nuevo.',
      );
    }
  });

  // ==========================================
  // MUTACIÓN 2: VERIFICACIÓN DEL CÓDIGO (2FA)
  // ==========================================
  const verifyMutation = useMutation({
    mutationFn: () => authService.verifyTwoFactor(email, code),
    onSuccess: (data) => {
      showToast.success('¡Autenticación de doble factor exitosa!');
      useAuthStore.getState().setUser(data.user);

      let destination = '/dashboard';
      if (data.user.mustChangePassword) {
        destination = '/change-password';
      } else {
        const searchParams = new URLSearchParams(window.location.search);
        const redirectUrl = searchParams.get('redirect');
        if (redirectUrl && redirectUrl.startsWith('/')) {
          destination = redirectUrl;
        }
      }

      window.location.replace(destination);
    },
    onError: (err: unknown) => {
      showToast.error(err, 'El código no es válido o ya venció. Solicita uno nuevo.');
    }
  });

  // ==========================================
  // WRAPPERS DE VALIDACIÓN CLIENTE
  // ==========================================
  const handleLogin = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast.error('Por favor, ingresa tu correo y contraseña.');
      return;
    }
    // Disparamos la mutación de TanStack Query
    loginMutation.mutate();
  };

  const handleVerify2FA = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!code.trim() || code.length < 6) {
      showToast.error('Ingresa el código de 6 dígitos enviado a tu correo.');
      return;
    }
    // Disparamos la mutación de verificación
    verifyMutation.mutate();
  };

  // Centralizamos el estado de carga
  const isSubmitting = loginMutation.isPending || verifyMutation.isPending;

  return {
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
    isSubmitting, // 👈 Se computa automáticamente por las mutaciones
    handleLogin,
    handleVerify2FA,
  };
}