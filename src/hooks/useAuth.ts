'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.services';
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
    onSuccess: () => {
      showToast.success('¡Autenticación de doble factor exitosa!');
      // Fuerza una navegación completa para que el proxy detecte la cookie HttpOnly
      window.location.assign('/dashboard');
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