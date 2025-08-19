'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/components/layout/loading';

export default function User() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFirstChallenge = async () => {
      try {
        const response = await fetch('/api/challenges');
        if (!response.ok) {
          throw new Error('Failed to fetch challenges');
        }
        const challengesData = await response.json();

        if (challengesData && challengesData.length > 0) {
          // 가장 최근 챌린지로 리다이렉션
          const sortedChallenges = challengesData.sort(
            (a: any, b: any) =>
              new Date(b.challenges.start_date).getTime() -
              new Date(a.challenges.start_date).getTime()
          );

          await router.push(`/${sortedChallenges[0].challenges.id}`);
        } else {
          throw new Error('참여 중인 챌린지가 없습니다');
        }
      } catch (error) {
// console.error('Error fetching first challenge:', error);
        alert(
          error instanceof Error
            ? error.message
            : '알 수 없는 오류가 발생했습니다'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchFirstChallenge();
  }, [router]);

  return isLoading ? <Loading ismessage={true} /> : null;
}
