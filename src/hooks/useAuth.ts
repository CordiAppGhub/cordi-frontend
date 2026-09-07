import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/use-auth.store';
import axios from 'axios';

export function useAuthLogin() {
  const router = useRouter();
  const loginStore = useAuthStore((state) => state.login);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

 const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!email.trim() || !password.trim()) return;

  setIsSubmitting(true);
  setError(null);

  try {
    await loginStore(email, password);

    // Fuerza una navegación completa para que el proxy
    // vuelva a ejecutarse con la cookie recién creada.
    window.location.href = '/dashboard';

  } catch (err: unknown) {
    setIsSubmitting(false);

    if (axios.isAxiosError(err)) {
      setError(
        err.response?.data?.message ||
        'Error al conectar con el servidor.'
      );
    } else if (err instanceof Error) {
      setError(err.message);
    } else {
      setError('Ocurrió un error inesperado.');
    }
  }
};

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    error,
    isSubmitting,
    handleLogin,
  };
}