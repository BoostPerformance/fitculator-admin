'use client';
import { useState, useEffect } from 'react';
import { ProcessedMeal } from '@/types/dietDetaileTableTypes';

export const useDietData = (challengeId: string | string[] | undefined) => {
  const [challenges, setChallenges] = useState<ProcessedMeal[]>([]);
  const [adminData, setAdminData] = useState({
    admin_role: '',
    display_name: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const challengesResponse = await fetch('/api/challenges');
        if (!challengesResponse.ok) {
          throw new Error('Failed to fetch challenges');
        }
        const challengeData = await challengesResponse.json();
        setChallenges(challengeData);

        const adminResponse = await fetch('/api/admin-users');
        if (!adminResponse.ok) {
          throw new Error('Failed to fetch admin data');
        }
        const adminData = await adminResponse.json();
        setAdminData(adminData);
      } catch (error) {
        console.log('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return { challenges, adminData };
};
