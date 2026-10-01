'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.services';
import { showToast } from '@/utils/alerts';
import axios, { AxiosError } from 'axios';

interface BackendErrorResponse {
  message?: string;
}

export function useAuthLogin() {
  // ==========================================
  // ESTADOS DE UI (Mantenemos useState para inputs y vistas)
  // ==========================================
  const [step, setStep] = useState<1 | 2>(1); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState(''); 
  const [showPassword, setShowPassword] = useState(false);

  // ==========================================
  // MUTACIÓN 1: LOGIN Y ENVÍO DE OTP
  // ==========================================
  const loginMutation = useMutation({
    mutationFn: () => authService.loginStepOne(email, password),
    onSuccess: (data) => {
      if (data?.requires2FA) {
        showToast.success('¡Credenciales correctas! Código enviado a tu correo.');
        setStep(2); // Pasamos al paso 2
      }
    },
    onError: (err: unknown) => {
      let message = 'Error al conectar con el servidor.';
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<BackendErrorResponse>;
        message = axiosError.response?.data?.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      showToast.error(message);
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
      let message = 'Código de verificación inválido o expirado.';
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<BackendErrorResponse>;
        message = axiosError.response?.data?.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      showToast.error(message);
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