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

export const useAdminData = () => {
  const { data: adminData, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchAdminData,
    staleTime: 15 * 60 * 1000, // 15분
    gcTime: 60 * 60 * 1000, // 1시간
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    initialData: {
      admin_role: '',
      username: '',
    },
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
  };
};
