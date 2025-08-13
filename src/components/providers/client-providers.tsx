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
            staleTime: 5 * 60 * 1000, // 5분 - 더 길게 캐시
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: false, // 마운트시 자동 refetch 비활성화
            refetchOnReconnect: 'always', // 재연결시에만 refetch
            gcTime: 10 * 60 * 1000, // 10분 가비지 컬렉션 시간
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
