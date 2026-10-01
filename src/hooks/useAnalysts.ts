'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api.service'; // Asegúrate de que esta es la ruta a tu instancia de Axios

interface Analyst {
  id: number;
  name: string;
  email: string;
}

export function useAnalysts() {
  const {
    data: analysts = [],
    isLoading: isLoadingAnalysts,
    error,
  } = useQuery({
    queryKey: ['active-analysts'],
    queryFn: async (): Promise<Analyst[]> => {
      const response = await api.get('/users/analysts'); // Llamamos al nuevo endpoint
      return response.data;
    },
    staleTime: 1000 * 60 * 15, // Cache de 15 minutos, los analistas no cambian tan seguido
  });

  return {
    analysts,
    isLoadingAnalysts,
    error,
  };
}