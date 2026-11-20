// src/providers/query-provider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { shouldRetryApiRequest } from '@/utils/api-error';
import { bindSocketQueryCache } from '@/lib/socket';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
 
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) =>
          failureCount < 1 && shouldRetryApiRequest(error),
        retryDelay: 1000,
      },
    },
  }));

  useEffect(() => bindSocketQueryCache(queryClient), [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}