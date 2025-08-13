'use client';
import { useQuery } from '@tanstack/react-query';

interface SessionData {
  user?: {
    id: string;
    email: string;
    name: string;
  };
  expires?: string;
}

const fetchSession = async (): Promise<SessionData | null> => {
  const response = await fetch('/api/auth/session');
  if (!response.ok) return null;
  return response.json();
};

export const useSession = () => {
  const { data: session, isLoading, error, refetch } = useQuery({
    queryKey: ['auth-session'],
    queryFn: fetchSession,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 30 * 60 * 1000, // 30분
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });

  return { 
    session,
    isLoading,
    error,
    refetch,
  };
};