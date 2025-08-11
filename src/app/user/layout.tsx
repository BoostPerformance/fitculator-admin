'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Sidebar from '@/components/fixedBars/sidebar';
import LogoutButton from '@/components/buttons/logoutButton';

interface Challenges {
  challenges: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    challenge_type: 'diet' | 'exercise' | 'diet_and_exercise';
  };
}

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [challenges, setChallenges] = useState<Challenges[]>([]);
  const [adminData, setAdminData] = useState({ admin_role: '', username: '' });
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [userDropdown, setUserDropdown] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 관리자 정보 가져오기
        const adminResponse = await fetch('/api/admin-users');
        if (!adminResponse.ok) {
          throw new Error('Failed to fetch admin data');
        }
        const adminData = await adminResponse.json();
        // console.log('받아온 관리자 데이터:', adminData);
        setAdminData({
          admin_role: adminData.admin_role || '',
          username: adminData.username || '',
        });

        // 챌린지 데이터 가져오기
        // console.log('챌린지 API 호출 시작...');
        const challengesResponse = await fetch('/api/challenges');
        // console.log('챌린지 API 응답 상태:', challengesResponse.status);
        
        if (!challengesResponse.ok) {
          const errorData = await challengesResponse.json();
          console.error('챌린지 API 오류:', errorData);
          throw new Error('Failed to fetch challenges');
        }
        const challengesData = await challengesResponse.json();
        // console.log('받아온 챌린지 데이터:', challengesData);
        // console.log("받아온 챌린지 데이터:", {
        //   원본데이터: challengesData,
        //   데이터타입: typeof challengesData,
        //   배열여부: Array.isArray(challengesData),
        //   첫번째항목: challengesData[0],
        // });

        if (Array.isArray(challengesData) && challengesData.length > 0) {
          // API 응답 구조에 맞게 데이터 변환
          const formattedChallenges = challengesData.map((challenge: any) => {
            // console.log('처리 중인 챌린지:', challenge);

            // 챌린지 데이터의 모든 키 출력
            // console.log('챌린지 원본 데이터의 키:', Object.keys(challenge));

            // 챌린지 데이터 추출 시도
            let challengeData;
            let id, title, start_date, end_date, challenge_type;

            if (challenge.challenges) {
              // Case 1: challenges 키가 있는 경우
              challengeData = challenge.challenges;
              id = challengeData.id;
              title = challengeData.title;
              start_date = challengeData.start_date;
              end_date = challengeData.end_date;
              challenge_type =
                challengeData.challenge_type || 'diet_and_exercise'; // 기본값 설정
            } else if (challenge.challenge_id) {
              // Case 2: RPC 응답 구조
              id = challenge.challenge_id;
              title = challenge.challenge_title;
              start_date = challenge.challenge_start_date;
              end_date = challenge.challenge_end_date;
              challenge_type = challenge.challenge_type || 'diet_and_exercise'; // 기본값 설정
            } else {
              // Case 3: 최상위 레벨 데이터
              id = challenge.id;
              title = challenge.title;
              start_date = challenge.start_date;
              end_date = challenge.end_date;
              challenge_type = challenge.challenge_type || 'diet_and_exercise'; // 기본값 설정
            }

            // console.log('변환된 챌린지:', {
            //   id,
            //   title,
            //   start_date,
            //   end_date,
            //   원본: challenge,
            // });

            return {
              challenges: {
                id,
                title,
                start_date,
                end_date,
                challenge_type,
              },
            };
          });
          // console.log('변환된 챌린지 데이터:', formattedChallenges);
          setChallenges(formattedChallenges);
        } else {
          // console.log('챌린지 데이터가 없거나 올바른 형식이 아님');
          setChallenges([]);
        }
      } catch (error) {
        console.error('데이터 가져오기 실패:', error);
      }
    };

    fetchData();
  }, []);
  const handleChallengeSelect = (challengeId: string) => {
    // 선택된 챌린지 찾기
    const selectedChallenge = challenges.find(
      (challenge) => challenge.challenges.id === challengeId
    );

    if (selectedChallenge) {
      setSelectedChallengeId(challengeId);
    }
  };

  return (
    <div className="relative">
      <div className="absolute right-8 top-4 z-50 hidden lg:flex md:hidden items-center gap-2">
        <div className="text-gray-500 text-sm whitespace-nowrap">
          안녕하세요, {adminData.username} !
        </div>
        <button
          onClick={() => setUserDropdown(!userDropdown)}
          className="flex items-center"
        >
          <Image
            src="/svg/arrow-down.svg"
            width={20}
            height={20}
            alt="arrow-down"
            className="w-[0.8rem]"
          />
        </button>
        {userDropdown && (
          <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-md px-4 py-2 z-50 min-w-[100px]">
            <LogoutButton />
          </div>
        )}
      </div>
      <div className="flex md:flex-col sm:flex-col min-h-screen">
        <Sidebar
          data={challenges}
          onSelectChallenge={handleChallengeSelect}
          coach={adminData.username}
          selectedChallengeId={selectedChallengeId}
          username={adminData.username}
        />
        <main className="flex-1 px-[1rem] py-[1.25rem] sm:px-0 sm:py-0 bg-white-1 dark:bg-blue-4">
          {children}
        </main>
      </div>
    </div>
  );
}
