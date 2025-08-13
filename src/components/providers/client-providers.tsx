'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import ServiceWorkerRegister from '../ServiceWorkerRegister';

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  // React Query 클라이언트 생성 - 컴포넌트 내부에서 생성하여 SSR 문제 방지
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5분 - 더 길게 캐싱
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: false, // 마운트 시 재요청 방지
            refetchOnReconnect: false,
            gcTime: 30 * 60 * 1000, // 30분 - 메모리에 더 오래 유지
            notifyOnChangeProps: ['data', 'error'], // 필요한 props만 구독
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ThemeProvider enableSystem={true} attribute="class">
          <ServiceWorkerRegister />
          {children}
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
