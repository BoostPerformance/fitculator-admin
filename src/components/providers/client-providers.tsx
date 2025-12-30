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
            staleTime: 1 * 60 * 1000, // 1분 - 더 짧은 캐싱으로 최신 데이터 보장
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: true, // 마운트 시 항상 재요청
            refetchOnReconnect: false,
            gcTime: 5 * 60 * 1000, // 5분 - 메모리 캐시 시간 단축
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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true} disableTransitionOnChange>
          <ServiceWorkerRegister />
          {children}
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
