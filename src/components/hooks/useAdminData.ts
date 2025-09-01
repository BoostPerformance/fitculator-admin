'use client';
import { useQuery } from '@tanstack/react-query';

interface AdminData {
  admin_role: string;
  username: string;
}

const fetchAdminData = async (): Promise<AdminData> => {
  const response = await fetch('/api/admin-users');
  if (!response.ok) throw new Error('Failed to fetch admin data');
  return response.json();
};

export function useAdminData() {
  const { data: adminData, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchAdminData,
    staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
    gcTime: 1000 * 60 * 10, // 10분간 가비지 컬렉션 방지
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
  });

  const fetchAdminDataRefresh = async () => {
    const result = await refetch();
    return result.data;
  };

  return { 
    adminData: adminData || { admin_role: '', username: '' }, 
    fetchAdminData: fetchAdminDataRefresh,
    isLoading,
    error,
    // 로딩 중이거나 username이 없을 때 처리
    displayUsername: isLoading ? '로딩 중...' : (adminData?.username || '사용자'),
    hasData: !!adminData && !!adminData.username,
  };
}
