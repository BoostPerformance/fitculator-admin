'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
}

interface ChallengeMember {
  id: string;
  service_user_id: string;
  users: User;
}

export const useChallengeMembers = (challengeId: string) => {
  const [members, setMembers] = useState<ChallengeMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!challengeId) return;

    const fetchMembers = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const res = await fetch(
          `/api/challenge-participants?challenge_id=${challengeId}&limit=1000`
        );
        
        if (!res.ok) {
          throw new Error('멤버 목록 로딩 실패');
        }
        
        const data = await res.json();
        
        // 운동 참가자만 필터링 (status가 active인 경우)
        const activeMembers = data.data.filter(
          (member: any) => member.status !== 'dropped'
        );
        
        // 이름순으로 정렬 (한글 > 영문 순)
        const sortedMembers = activeMembers.sort((a: ChallengeMember, b: ChallengeMember) => {
          const nameA = a.users.name || a.users.username || '';
          const nameB = b.users.name || b.users.username || '';
          return nameA.localeCompare(nameB, 'ko');
        });
        
        setMembers(sortedMembers);
      } catch (err) {
// console.error('멤버 목록 로딩 에러:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 에러');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [challengeId]);

  return { members, loading, error };
};