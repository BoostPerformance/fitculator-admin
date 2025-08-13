'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

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
            staleTime: 1 * 60 * 1000, // 1분으로 줄임
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: true, // 기본값으로 복원
            refetchOnReconnect: false, // 불필요한 재연결 방지
            gcTime: 5 * 60 * 1000, // 5분으로 줄임
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ThemeProvider enableSystem={true} attribute="class">
          {children}
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
