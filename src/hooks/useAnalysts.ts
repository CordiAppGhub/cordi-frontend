'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api.service'; 

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
      const response = await api.get('/users/analysts');
      return response.data;
    },
    staleTime: 1000 * 60 * 15, 
  });

  return {
    analysts,
    isLoadingAnalysts,
    error,
  };
}