'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Organization {
  id: string;
  name: string;
}

interface Challenge {
  id: string;
  challenges?: {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    banner_image_url: string;
    cover_image_url: string;
    challenge_type: string;
    organization_id: string;
  };
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  banner_image_url?: string;
  cover_image_url?: string;
  challenge_type?: string;
  organization_id?: string;
}

export default function ManageChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 챌린지 목록 가져오기
  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/challenges');
        if (response.ok) {
          const data = await response.json();
          // 챌린지 데이터 구조에 따라 적절히 처리
          const challengeList = Array.isArray(data) ? data : [];
          setChallenges(challengeList);
        }
      } catch (error) {
// console.error('챌린지 목록 가져오기 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChallenges();
  }, []);

  // 조직 목록 가져오기
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch('/api/organizations');
        if (response.ok) {
          const data = await response.json();
          setOrganizations(data);
        }
      } catch (error) {
// console.error('조직 목록 가져오기 오류:', error);
      }
    };

    fetchOrganizations();
  }, []);

  // 조직 이름 가져오기
  const getOrganizationName = (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId);
    return org ? org.name : '알 수 없음';
  };

  // 챌린지 유형 한글 변환
  const getChallengeTypeText = (type: string) => {
    switch (type) {
      case 'diet':
        return '식단';
      case 'exercise':
        return '운동';
      case 'diet_and_exercise':
        return '식단 및 운동';
      default:
        return '알 수 없음';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">챌린지 관리</h1>

      {isLoading || organizations.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500 dark:text-gray-400">로딩 중...</p>
        </div>
      ) : challenges.length === 0 ? (
        <div className="bg-white dark:bg-blue-4 rounded-lg shadow p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            등록된 챌린지가 없습니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              className="bg-white dark:bg-blue-4 rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() =>
                router.push(`/admin/manage-challenges/${challenge.challenges?.id || challenge.id}`)
              }
            >
              <div className="h-40 bg-gray-200 dark:bg-blue-3 relative">
                {(challenge.challenges?.cover_image_url || challenge.cover_image_url) ? (
                  <Image
                    src={challenge.challenges?.cover_image_url || challenge.cover_image_url || ''}
                    alt={challenge.challenges?.title || challenge.title || ''}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    이미지 없음
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-2 dark:text-white">
                  {challenge.challenges?.title || challenge.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {(challenge.challenges?.description || challenge.description)
                    ? (challenge.challenges?.description || challenge.description || '').length > 100
                      ? `${(challenge.challenges?.description || challenge.description || '').substring(0, 100)}...`
                      : (challenge.challenges?.description || challenge.description)
                    : '설명 없음'}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <p>조직: {getOrganizationName(challenge.challenges?.organization_id || challenge.organization_id || '')}</p>
                  <p>유형: {getChallengeTypeText(challenge.challenges?.challenge_type || challenge.challenge_type || '')}</p>
                  <p>
                    기간: {new Date(challenge.challenges?.start_date || challenge.start_date || '').toLocaleDateString()}{' '}
                    ~ {new Date(challenge.challenges?.end_date || challenge.end_date || '').toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
