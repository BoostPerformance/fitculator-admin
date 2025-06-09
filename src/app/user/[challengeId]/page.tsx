'use client';

import { useEffect, useState } from 'react';
import Footer from '@/components/layout/footer';
import TrafficSourceChart from '@/components/graph/trafficSourceChart';
import DailyDietRecord from '@/components/graph/dailyDietRecord';
import WorkoutLeaderboard from '@/components/graph/workoutLeaderboard';
import DietTable from '@/components/dietDashboard/dietTable';
import TotalFeedbackCounts from '@/components/totalCounts/totalFeedbackCount';
import Title from '@/components/layout/title';
import { useParams } from 'next/navigation';
import { ChallengeDashboardSkeleton } from '@/components/layout/skeleton';
import WeeklyWorkoutChart from '@/components/graph/WeeklyWorkoutChart';

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
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [challenges, setChallenges] = useState<Challenges[]>([]);
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
  const [adminData, setAdminData] = useState({
    admin_role: '',
    username: '',
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

  // 피드백 데이터 가져오기
  const fetchFeedbackData = async (challengeId: string) => {
    try {
      setIsLoadingFeedbacks(true);

      // 챌린지 전체 피드백 통계 가져오기
      const statsResponse = await fetch(
        `/api/challenge-feedback-counts?challengeId=${challengeId}`
      );
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setTotalFeedbackStats({
          totalFeedbacks: statsData.totalFeedbacks || 0,
          totalParticipants: statsData.totalParticipants || 0,
          feedbackPercentage: statsData.feedbackPercentage || 0,
        });
      }

      // 챌린지 참가자 목록 가져오기
      const participantsResponse = await fetch(
        `/api/challenge-participants?challenge_id=${challengeId}&limit=100`
      );
      if (!participantsResponse.ok) {
        throw new Error('Failed to fetch participants');
      }

      const participantsData = await participantsResponse.json();
      const participants = participantsData.data;

      // 참가자별 피드백 데이터 가져오기
      const feedbackCounts: Record<string, number> = {};

      await Promise.all(
        participants.map(async (participant) => {
          if (!participant.id) return;

          try {
            const feedbackResponse = await fetch(
              `/api/test-feedbacks?participantId=${participant.id}`
            );
            if (feedbackResponse.ok) {
              const data = await feedbackResponse.json();
              feedbackCounts[participant.id] =
                data.dailyRecordsWithFeedback || 0;
            }
          } catch (error) {
            console.error(
              `Error fetching feedback for participant ${participant.id}:`,
              error
            );
            feedbackCounts[participant.id] = 0;
          }
        })
      );

      setFeedbackData(feedbackCounts);
    } catch (error) {
      console.error('Error fetching feedback data:', error);
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
      console.error('Error fetching diet uploads:', error);
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
        // 오늘 운동한 멤버 수 조회
        const workoutCountResponse = await fetch(
          `/api/workouts?type=today-count&challengeId=${params.challengeId}`
        );
        if (!workoutCountResponse.ok) {
          throw new Error('Failed to fetch workout count');
        }
        const workoutCountData = await workoutCountResponse.json();
        setWorkOutCountToday(workoutCountData.count);

        // 챌린지 데이터 가져오기
        const challengesResponse = await fetch('/api/challenges');
        if (!challengesResponse.ok) {
          throw new Error('Failed to fetch challenges');
        }
        const challengesData = await challengesResponse.json();

        const sortedChallenges = challengesData.sort(
          (a: Challenges, b: Challenges) => {
            return (
              new Date(b.challenges.start_date).getTime() -
              new Date(a.challenges.start_date).getTime()
            );
          }
        );

        console.log('🔍  challengesData:', sortedChallenges);

        // console.log('🔍 Sorted challenges1:', sortedChallenges1);

        setChallenges(sortedChallenges);
        // 첫 번째 챌린지를 기본값으로 설정
        if (sortedChallenges.length > 0) {
          setSelectedChallengeId(sortedChallenges[0].challenges.id);
        }

        // 코치 데이터 가져오기
        const coachResponse = await fetch('/api/coach-info');
        if (!coachResponse.ok) {
          throw new Error('Failed to fetch coach data');
        }
        const coachData = await coachResponse.json();
        setCoachData(coachData);

        // 어드민 데이터 가져오기
        const adminResponse = await fetch('/api/admin-users');
        if (!adminResponse.ok) {
          throw new Error('Failed to fetch admin data');
        }
        const adminData = await adminResponse.json();
        setAdminData(adminData);

        // 데일리레코드(테이블 정보) 가져오기
        await fetchDailyRecords(1);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false); // 데이터 로딩 완료
      }
    };

    fetchData();
    return () => window.removeEventListener('resize', handleResize);
  }, [params.challengeId]);

  const fetchDailyRecords = async (pageNum: number) => {
    try {
      setLoading(true);
      const url = new URL(
        '/api/challenge-participants',
        window.location.origin
      );
      url.searchParams.append('page', pageNum.toString());
      url.searchParams.append('limit', '30');
      url.searchParams.append('with_records', 'true');

      if (selectedChallengeId) {
        url.searchParams.append('challenge_id', selectedChallengeId);
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch daily-records data');
      }
      const data = await response.json();
      if (pageNum === 1) {
        setDailyRecords(data.data);
      } else {
        setDailyRecords((prev) => [...prev, ...data.data]);
      }

      return data.data.length > 0;
    } catch (error) {
      console.error('Error fetching daily records:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const urlChallengeId = params.challengeId;

    if (
      urlChallengeId &&
      challenges.some((c) => c.challenges.id === urlChallengeId)
    ) {
      setSelectedChallengeId(urlChallengeId);
    }
  }, [challenges, params.challengeId]);

  // 챌린지 ID가 변경될 때마다 데이터 업데이트
  useEffect(() => {
    if (selectedChallengeId) {
      // 데이터 불러오기
      fetchTodayDietUploads(selectedChallengeId);
      fetchFeedbackData(selectedChallengeId);
      fetchDailyRecords(1);

      // 운동 업로드 수 조회
      fetch(`/api/workouts?type=today-count&challengeId=${selectedChallengeId}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to fetch workout count');
          }
          return response.json();
        })
        .then((data) => {
          setWorkOutCountToday(data.count);
        })
        .catch((error) => {
          console.error('Error fetching workout count:', error);
        });
    }
  }, [selectedChallengeId]);

  const handleChallengeSelect = (challengeId: string) => {
    const selectedChallenge = challenges.find(
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
    const selectedChallenge = challenges.find(
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
    return <ChallengeDashboardSkeleton />;
  }

  return (
    <div className="bg-white-1 dark:bg-blue-4 flex flex-col min-h-screen sm:px-[1rem] md:px-[0.4rem]">
      <div className="flex gap-[1rem] flex-1 sm:flex-col md:flex-col">
        <main className="flex-1 overflow-y-auto">
          <div className="pt-[2rem] pb-[2rem] sm:pt-0">
            <div className="px-4 sm:px-4 relative lg:mb-8 md:mb-4 sm:my-4">
              <Title
                title={
                  challenges.find(
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
              {challenges.find((c) => c.challenges.id === selectedChallengeId)
                ?.challenges.challenge_type !== 'diet' && (
                <TotalFeedbackCounts
                  counts={`${workOutCountToday}`}
                  total={`${filteredDailyRecordsbyId.length}명`}
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
              {challenges.find((c) => c.challenges.id === selectedChallengeId)
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
              {challenges.find((c) => c.challenges.id === selectedChallengeId)
                ?.challenges.challenge_type === 'diet' && (
                <DailyDietRecord activities={filteredDailyRecordsbyId} />
              )}
              {challenges.find((c) => c.challenges.id === selectedChallengeId)
                ?.challenges.challenge_type === 'exercise' && (
                <>
                  <TrafficSourceChart challengeId={selectedChallengeId} />
                  <WorkoutLeaderboard challengeId={selectedChallengeId} />
                  <WeeklyWorkoutChart challengeId={selectedChallengeId} />
                </>
              )}
              {challenges.find((c) => c.challenges.id === selectedChallengeId)
                ?.challenges.challenge_type === 'diet_and_exercise' && (
                <>
                  <TrafficSourceChart challengeId={selectedChallengeId} />
                  <DailyDietRecord activities={filteredDailyRecordsbyId} />
                  <WorkoutLeaderboard challengeId={selectedChallengeId} />
                  <WeeklyWorkoutChart challengeId={selectedChallengeId} />
                </>
              )}
            </div>

            <div className="dark:bg-blue-4 bg-gray-100 lg:pt-[1rem]  bg-white-1 px-4 sm:px-4">
              <DietTable
                dailyRecordsData={filteredDailyRecordsbyId}
                challengeId={selectedChallengeId}
                loading={isLoadingFeedbacks || loading}
                feedbackData={feedbackData}
              />
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
