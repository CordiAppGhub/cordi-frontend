'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/use-auth.store';
import axios, { AxiosError } from 'axios';
import { showToast } from '@/utils/alerts';

interface BackendErrorResponse {
  message?: string;
}

export function useAuthLogin() {
  const loginStore = useAuthStore((state) => state.login);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      showToast.error('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    setIsSubmitting(true);

    try {
      await loginStore(email, password);

      // Fuerza una navegación completa para que el proxy
      // detecte la cookie HttpOnly recién creada por el backend.
      window.location.assign('/dashboard');

    } catch (err: unknown) {
      setIsSubmitting(false);

      let message = 'Error al conectar con el servidor.';

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
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    isSubmitting,
    handleLogin,
  };
}