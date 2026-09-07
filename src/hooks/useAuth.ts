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
      
      // ✅ Usamos router.push() recomendando la navegación interna de Next.js
      router.push('/dashboard');
      
    } catch (err: unknown) {
      setIsSubmitting(false);
      if (err instanceof Error) {
        setError(err.message);
      } else if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al conectar con el servidor.');
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