'use client';

import { useEffect, useState, useRef } from 'react';
import TrafficSourceChart from '@/components/graph/trafficSourceChart';
import DailyDietRecord from '@/components/graph/dailyDietRecord';
import WorkoutLeaderboard from '@/components/graph/workoutLeaderboard';
import DietTable from '@/components/dietDashboard/dietTable';
import TotalFeedbackCounts from '@/components/totalCounts/totalFeedbackCount';
import Title from '@/components/layout/title';
import { useParams } from 'next/navigation';
import { MainPageSkeleton } from '@/components/layout/skeleton';
import WeeklyWorkoutChart from '@/components/graph/WeeklyWorkoutChart';
import DailyWorkoutRecord from '@/components/graph/dailyWorkoutRecord';
import { useAdminData } from '@/components/hooks/useAdminData';
import { useChallenge } from '@/components/hooks/useChallenges';
import { useWorkoutDataQuery } from '@/components/hooks/useWorkoutDataQuery';
// import { cachedAPI } from '@/utils/api';
//import DailyWorkoutRecordMobile from '@/components/graph/dailyWorkoutRecordMobile';

interface AdminUser {
  email: string;
  username: string;
}

interface Challenge {
  id: string;
  title: string;
  participants: Array<any>;
}

interface CoachData {
  id: string;
  admin_user_id: string;
  organization_id: string;
  organization_name: string;
  profile_image_url: string | null;
  introduction: string;
  specialization: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  admin_users: AdminUser;
  challenge_coaches: Array<{ challenge: Challenge }>;
}

interface Challenges {
  challenges: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    challenge_type: 'diet' | 'exercise' | 'diet_and_exercise';
  };
}

type ParamsType = {
  challengeId: string;
};

const calculateChallengeProgress = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();

  // 전체 챌린지 기간 계산
  const totalDays =
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // 오늘까지의 진행 일수 계산
  let progressDays;
  if (today < start) {
    progressDays = 0;
  } else if (today > end) {
    progressDays = totalDays;
  } else {
    progressDays = Math.ceil(
      (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  return {
    progressDays: progressDays.toString(),
    totalDays: totalDays.toString(),
  };
};

export default function User() {
  const params = useParams() as ParamsType;
  const [workoutCount, setWorkoutCount] = useState(0);
  const [workOutCountToday, setWorkOutCountToday] = useState<number>(0);
  const [totalParticipants, setTotalParticipants] = useState<number>(0);
  // todayStats는 React Query의 todayCount로 대체
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [dailyRecords, setDailyRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [todayDietUploads, setTodayDietUploads] = useState<{
    counts: string;
    total: string;
  } | null>(null);
  const [feedbackData, setFeedbackData] = useState<Record<string, number>>({});
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(false);
  const [totalFeedbackStats, setTotalFeedbackStats] = useState({
    totalFeedbacks: 0,
    totalParticipants: 0,
    feedbackPercentage: 0,
  });
  const [coachData, setCoachData] = useState<CoachData>({
    id: '',
    admin_user_id: '',
    organization_id: '',
    organization_name: '',
    profile_image_url: '',
    introduction: '',
    specialization: [],
    is_active: false,
    created_at: '',
    updated_at: '',
    admin_users: {
      email: '',
      username: '',
    },
    challenge_coaches: [],
  });

  // React Query hooks 사용으로 API 호출 최적화
  const { adminData } = useAdminData();
  const { challenges } = useChallenge();
  const { 
    weeklyChart, 
    leaderboard, 
    todayCount, 
    isLoading: workoutDataLoading, 
    error: workoutDataError 
  } = useWorkoutDataQuery(selectedChallengeId);
  
  // 챌린지 데이터 변환
  const formattedChallenges: Challenges[] = challenges?.map((challenge) => ({
    challenges: {
      id: challenge.challenges.id,
      title: challenge.challenges.title,
      start_date: challenge.challenges.start_date,
      end_date: challenge.challenges.end_date,
      challenge_type: (challenge.challenges as any).challenge_type || 'diet_and_exercise',
    },
  })) || [];

  // 피드백 데이터 가져오기 - 배치 처리로 최적화
  const fetchFeedbackData = async (challengeId: string) => {
    try {
      setIsLoadingFeedbacks(true);

      // 챌린지 참가자 목록 가져오기
      const participantsResponse = await fetch(
        `/api/challenge-participants?challenge_id=${challengeId}&limit=100`
      );
      if (!participantsResponse.ok) {
        throw new Error('Failed to fetch participants');
      }

      const participantsData = await participantsResponse.json();
      const participants = participantsData.data;

      // 참가자별 피드백 데이터를 배치로 가져오기 (최대 5개씩)
      const feedbackCounts: Record<string, number> = {};
      const batchSize = 5;
      
      for (let i = 0; i < participants.length; i += batchSize) {
        const batch = participants.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (participant: any) => {
            if (!participant.id) return;

            try {
              const feedbackResponse = await fetch(
                `/api/test-feedbacks?participantId=${participant.id}`
              );
              if (feedbackResponse.ok) {
                const data = await feedbackResponse.json();
                feedbackCounts[participant.id] = data.dailyRecordsWithFeedback || 0;
              }
            } catch (error) {
              if (process.env.NODE_ENV === 'development') {
// console.error(`Error fetching feedback for participant ${participant.id}:`, error);
              }
              feedbackCounts[participant.id] = 0;
            }
          })
        );
        
        // 배치 간 지연 (서버 부하 방지)
        if (i + batchSize < participants.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setFeedbackData(feedbackCounts);
    } catch (error) {
// console.error('Error fetching feedback data:', error);
    } finally {
      setIsLoadingFeedbacks(false);
    }
  };

  // 오늘 식단 업로드 수 조회
  const fetchTodayDietUploads = async (challengeId: string) => {
    try {
      const response = await fetch(
        `/api/diet-uploads?challengeId=${challengeId}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch diet uploads');
      }
      const data = await response.json();
      setTodayDietUploads(data);
    } catch (error) {
// console.error('Error fetching diet uploads:', error);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const fetchData = async () => {
      try {
        setLoading(true); // 데이터 로딩 시작
        
        // React Query로 운동 데이터 최적화됨

        // React Query로 데이터 가져오기로 대체됨

        // 코치 데이터 가져오기
        const coachResponse = await fetch('/api/coach-info');
        if (!coachResponse.ok) {
          throw new Error('Failed to fetch coach data');
        }
        const coachData = await coachResponse.json();
        setCoachData(coachData);

        // React Query로 어드민 데이터 가져오기로 대체됨

        // 데일리레코드(테이블 정보) 가져오기
        await fetchDailyRecords(1);
      } catch (error) {
// console.error('Error fetching data:', error);
      } finally {
        setLoading(false); // 데이터 로딩 완료
      }
    };

    fetchData();
    return () => window.removeEventListener('resize', handleResize);
  }, [params.challengeId]);

  // 중복 제거를 위한 캐시 메모리 (컴포넌트 외부에 선언하여 전역으로 관리)
  const dailyRecordsCache = useRef(new Map<string, any>());

  // 컴포넌트 마운트 시 캐시 초기화
  useEffect(() => {
    dailyRecordsCache.current.clear();
  }, []); // 컴포넌트 최초 마운트 시에만 실행

  const fetchDailyRecords = async (pageNum: number, loadAll: boolean = false) => {
    const cacheKey = `${selectedChallengeId}_${pageNum}_${loadAll}`;
    
    // 캐시된 데이터가 있으면 사용
    if (dailyRecordsCache.current.has(cacheKey)) {
      const cachedData = dailyRecordsCache.current.get(cacheKey);
      if (pageNum === 1) {
        setDailyRecords(cachedData);
      } else {
        setDailyRecords((prev) => [...prev, ...cachedData]);
      }
      return cachedData.length > 0;
    }

    try {
      setLoading(true);
      const url = new URL(
        '/api/challenge-participants',
        window.location.origin
      );
      url.searchParams.append('page', pageNum.toString());
      // 모든 멤버를 가져오기 위해 limit을 크게 설정
      url.searchParams.append('limit', loadAll ? '100' : '30');
      url.searchParams.append('with_records', 'true');

      if (selectedChallengeId) {
        url.searchParams.append('challenge_id', selectedChallengeId);
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch daily-records data');
      }
      const data = await response.json();
      
      // 캐시에 저장 (useRef 사용)
      dailyRecordsCache.current.set(cacheKey, data.data);

      if (pageNum === 1) {
        setDailyRecords(data.data);
      } else {
        setDailyRecords((prev) => [...prev, ...data.data]);
      }

      // loadAll이 true이고 더 많은 데이터가 있으면 재귀적으로 호출
      if (loadAll && data.data.length === 100) {
        await fetchDailyRecords(pageNum + 1, true);
      }

      return data.data.length > 0;
    } catch (error) {
// console.error('Error fetching daily records:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const urlChallengeId = params.challengeId;

    if (
      urlChallengeId &&
      formattedChallenges.some((c) => c.challenges.id === urlChallengeId)
    ) {
      setSelectedChallengeId(urlChallengeId);
    } else if (formattedChallenges.length > 0 && !selectedChallengeId) {
      // 첫 번째 챌린지를 기본값으로 설정
      setSelectedChallengeId(formattedChallenges[0].challenges.id);
    }
  }, [formattedChallenges, params.challengeId, selectedChallengeId]);

  // 챌린지 ID가 변경될 때마다 데이터 업데이트
  useEffect(() => {
    if (selectedChallengeId && formattedChallenges.length > 0) {
      // 챌린지가 변경되면 캐시 초기화
      dailyRecordsCache.current.clear();
      
      // 현재 선택된 챌린지 정보 가져오기
      const currentChallenge = formattedChallenges.find(
        (challenge) => challenge.challenges.id === selectedChallengeId
      );
      
      // 데이터 불러오기
      // 식단이 포함된 챌린지만 식단 관련 API 호출
      if (currentChallenge?.challenges.challenge_type !== 'exercise') {
        fetchTodayDietUploads(selectedChallengeId);
        fetchFeedbackData(selectedChallengeId);
      }
      
      // 모든 멤버를 가져오기 위해 loadAll을 true로 설정
      fetchDailyRecords(1, true);

      // React Query hook으로 운동 데이터 가져오기 최적화됨
    }
  }, [selectedChallengeId]);

  // React Query 데이터로 상태 업데이트
  useEffect(() => {
    if (todayCount) {
      setWorkOutCountToday(todayCount.count || 0);
      setTotalParticipants(todayCount.total || 0);
    }
  }, [todayCount]);

  // 리더보드 데이터 디버깅
  useEffect(() => {
    if (leaderboard) {
      console.log('현재 리더보드 데이터:', leaderboard);
    }
  }, [leaderboard]);

  const handleChallengeSelect = (challengeId: string) => {
    const selectedChallenge = formattedChallenges.find(
      (challenge) => challenge.challenges.id === challengeId
    );

    if (selectedChallenge) {
      setSelectedChallengeId(challengeId);
    }
  };

  const filteredDailyRecordsbyId = Array.isArray(dailyRecords)
    ? dailyRecords.filter(
        (record) => record.challenges.id === selectedChallengeId
      )
    : [];

  const getSelectedChallengeDates = () => {
    const selectedChallenge = formattedChallenges.find(
      (challenge) => challenge.challenges.id === selectedChallengeId
    );
    return selectedChallenge
      ? {
          startDate: selectedChallenge.challenges.start_date,
          endDate: selectedChallenge.challenges.end_date,
        }
      : null;
  };

  const challengeDates = getSelectedChallengeDates();
  const progress = challengeDates
    ? calculateChallengeProgress(
        challengeDates.startDate,
        challengeDates.endDate
      )
    : { progressDays: '0', totalDays: '0' };

  // 로딩 중일 때 스켈레톤 UI 표시
  if (loading) {
    return <MainPageSkeleton />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        <div className="pt-[2rem] pb-[2rem] sm:pt-0">
            <div className="px-4 sm:px-4 relative lg:mb-8 md:mb-4 sm:my-4">
              {/* 챌린지 기간 표시 */}
              {challengeDates && (
                <div className="text-0.875-400 text-gray-6 dark:text-gray-7 mb-2">
                  {new Date(challengeDates.startDate).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} - {new Date(challengeDates.endDate).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              )}
              <Title
                title={
                  formattedChallenges.find(
                    (challenge) =>
                      challenge.challenges.id === selectedChallengeId
                  )?.challenges.title || ''
                }
              />
            </div>

            <div className="grid grid-cols-4 gap-1 px-4 sm:px-4 sm:grid-cols-1 sm:mt-4">
              <TotalFeedbackCounts
                counts={progress.progressDays}
                total={`${progress.totalDays}일`}
                title="진행현황"
                borderColor="border-green"
                textColor="text-green"
              />
              {formattedChallenges.find((c) => c.challenges.id === selectedChallengeId)
                ?.challenges.challenge_type !== 'diet' && (
                <TotalFeedbackCounts
                  counts={`${workOutCountToday}`}
                  total={`${totalParticipants} 명`}
                  title={
                    <span>
                      오늘 운동 <br className="md:inline sm:hidden lg:hidden" />
                      업로드 멤버
                    </span>
                  }
                  borderColor="border-blue-5"
                  textColor="text-blue-5"
                />
              )}
              {formattedChallenges.find((c) => c.challenges.id === selectedChallengeId)
                ?.challenges.challenge_type !== 'exercise' && (
                <TotalFeedbackCounts
                  counts={todayDietUploads?.counts || '0'}
                  total={todayDietUploads?.total || '0명'}
                  title={
                    <span>
                      오늘 식단 <br className="md:inline sm:hidden lg:hidden" />
                      업로드 멤버
                    </span>
                  }
                  borderColor="border-yellow"
                  textColor="text-yellow"
                />
              )}
            </div>

            <div className="dark:bg-blue-4 grid grid-cols-6 gap-[1rem] my-6 sm:my-4 sm:flex sm:flex-col px-4 sm:px-4 ">
              {formattedChallenges.find((c) => c.challenges.id === selectedChallengeId)
                ?.challenges.challenge_type === 'diet_and_exercise' && (
                <>
                  <TrafficSourceChart challengeId={selectedChallengeId} />
                  <DailyDietRecord activities={filteredDailyRecordsbyId} />
                  <DailyWorkoutRecord activities={filteredDailyRecordsbyId} />
                  <WorkoutLeaderboard challengeId={selectedChallengeId} />
                  <WeeklyWorkoutChart 
                    data={weeklyChart} 
                    isLoading={workoutDataLoading} 
                    error={workoutDataError} 
                  />
                </>
              )}
              {formattedChallenges.find((c) => c.challenges.id === selectedChallengeId)
                ?.challenges.challenge_type === 'diet' && (
                <DailyDietRecord activities={filteredDailyRecordsbyId} />
              )}
              {formattedChallenges.find((c) => c.challenges.id === selectedChallengeId)
                ?.challenges.challenge_type === 'exercise' && (
                <>
                  <TrafficSourceChart challengeId={selectedChallengeId} />
                  <DailyWorkoutRecord activities={filteredDailyRecordsbyId} />
                  {/* <DailyWorkoutRecordMobile
                    activities={filteredDailyRecordsbyId}
                  /> */}
                  <WorkoutLeaderboard challengeId={selectedChallengeId} />
                  <WeeklyWorkoutChart 
                    data={weeklyChart} 
                    isLoading={workoutDataLoading} 
                    error={workoutDataError} 
                  />
                </>
              )}
            </div>

            {/* <div className="dark:bg-blue-4 bg-gray-100 lg:pt-[1rem] bg-white-1 px-4 sm:px-4">
              <DietTable
                dailyRecordsData={filteredDailyRecordsbyId}
                challengeId={selectedChallengeId}
                loading={isLoadingFeedbacks || loading}
                feedbackData={feedbackData}
              />
            </div> */}
          </div>
        </div>
    </div>
  );
}
