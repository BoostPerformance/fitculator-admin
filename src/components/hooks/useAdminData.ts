'use client';
import { useState } from 'react';

export const useAdminData = () => {
  const [adminData, setAdminData] = useState({
    admin_role: '',
    username: '',
  });

  const fetchAdminData = async () => {
    try {
      const response = await fetch('/api/admin-users');
      if (!response.ok) throw new Error('Failed to fetch admin data');
      const data = await response.json();
      setAdminData(data);
      return data;
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  return { adminData, fetchAdminData };
};
