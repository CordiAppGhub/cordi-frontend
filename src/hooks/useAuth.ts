// src/hooks/useAuth.ts
'use client';

import { useState } from 'react';
import { authService } from '@/services/auth.services';
import { showToast } from '@/utils/alerts';
import axios, { AxiosError } from 'axios';

interface BackendErrorResponse {
  message?: string;
}

export function useAuthLogin() {
  const [step, setStep] = useState<1 | 2>(1); // 👈 Control de pasos (1: Credenciales, 2: 2FA)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState(''); // 👈 Código de 6 dígitos
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // PASO 1: Enviar credenciales
  const handleLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      showToast.error('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await authService.loginStepOne(email, password);

      if (data?.requires2FA) {
        showToast.success('¡Credenciales correctas! Código enviado a tu correo.');
        setStep(2); // 👈 Pasamos a la vista del código OTP
      }
    } catch (err: unknown) {
      let message = 'Error al conectar con el servidor.';
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<BackendErrorResponse>;
        message = axiosError.response?.data?.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      showToast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // PASO 2: Verificar el código OTP de 6 dígitos
  const handleVerify2FA = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!code.trim() || code.length < 6) {
      showToast.error('Ingresa el código de 6 dígitos enviado a tu correo.');
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.verifyTwoFactor(email, code);

      showToast.success('¡Autenticación de doble factor exitosa!');
      
      // Fuerza una navegación completa para que el proxy detecte la cookie HttpOnly
      window.location.assign('/dashboard');
    } catch (err: unknown) {
      setIsSubmitting(false);
      let message = 'Código de verificación inválido o expirado.';
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<BackendErrorResponse>;
        message = axiosError.response?.data?.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      showToast.error(message);
    }
  };

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
    isSubmitting,
    handleLogin,
    handleVerify2FA,
  };
}