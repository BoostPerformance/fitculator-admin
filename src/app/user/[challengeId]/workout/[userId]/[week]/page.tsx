'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWorkoutData } from '@/components/hooks/useWorkoutData';
import TotalFeedbackCounts from '@/components/totalCounts/totalFeedbackCount';
import WeeklyWorkoutChart from '@/components/workoutDashboard/weeklyWorkoutChart';
import TextBox from '@/components/textBox';
import { CustomAlert } from '@/components/layout/customAlert';
import {
  generateBarChart,
  generateDonutChart,
} from '@/components/graph/generateCharts';
import { useSearchParams } from 'next/navigation';

const useUserInfo = (userId: string) => {
  const [name, setName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/user?userId=${userId}`);
        if (!res.ok) throw new Error('유저 정보 로딩 실패');
        const data = await res.json();
        setName(data.name || '알 수 없음');
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchUserInfo();
  }, [userId]);

  return { name, loading, error };
};

export default function MobileWorkoutDetail() {
  const params = useParams();
  const userId = params.userId as string;
  const challengeId = params.challengeId as string;
  const weekNumberParam = parseInt(params.week as string);
  const searchParams = useSearchParams();

  const router = useRouter();

  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [coachFeedback, setCoachFeedback] = useState('');
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copyMessage, setCopyMessage] = useState(false);
  const [isDisable, setIsDisable] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const {
    userData,
    loading,
    error: apiError,
    totalPoints,
  } = useWorkoutData(userId, challengeId);
  const { name: fetchedUserName } = useUserInfo(userId);

  useEffect(() => {
    if (
      !userData ||
      !userData.weeklyWorkouts.length ||
      isNaN(weekNumberParam)
    ) {
      setCurrentWeekIndex(0);
      return;
    }

    const foundIndex = userData.weeklyWorkouts.findIndex(
      (week) => week.weekNumber === weekNumberParam
    );

    setCurrentWeekIndex(foundIndex >= 0 ? foundIndex : 0);
  }, [userData, weekNumberParam]);

  useEffect(() => {
    const weeklyRecordId =
      userData?.weeklyWorkouts?.[currentWeekIndex]?.recordId;
    if (!weeklyRecordId) return;

    const fetchCoachFeedback = async () => {
      const res = await fetch(
        `/api/workout-feedback?workout_weekly_records_id=${weeklyRecordId}&challenge_id=${challengeId}`
      );
      const data = await res.json();
      if (res.ok && data.data) {
        setCoachFeedback(data.data.coach_feedback || '');
        setFeedbackId(data.data.id);
      } else {
        setCoachFeedback('');
        setFeedbackId(null);
      }
    };

    fetchCoachFeedback();
  }, [userData, currentWeekIndex]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params, challengeId]);

  const handleBack = () =>
    router.push(`/user/${params.challengeId}/workout`);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  if (apiError)
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded my-4">
        <h2 className="font-bold">데이터 로딩 오류</h2>
        <p>{apiError}</p>
      </div>
    );
  if (!userData)
    return <div>사용자 데이터를 불러오는 중 오류가 발생했습니다.</div>;

  const weekLabelParam = searchParams.get('label');
  const currentWeekData = userData.weeklyWorkouts.find(
    (week) => week.label === weekLabelParam
  ) || {
    recordId: '',
    label: '데이터 없음',
    workoutTypes: {},
    dailyWorkouts: [],
    feedback: {
      text: '피드백이 아직 없습니다.',
      author: 'AI 코치',
      date: new Date().toISOString(),
    },
    totalSessions: 0,
    requiredSessions: 2,
    totalAchievement: 0,
  };

  console.log('userData from useWorkoutData:', {
    weeklyWorkouts: userData.weeklyWorkouts,
    weekNumbers: userData.weeklyWorkouts.map(w => ({ weekNumber: w.weekNumber, label: w.label })),
    currentWeek: userData.weeklyWorkouts[currentWeekIndex],
    workoutTypes: currentWeekData.workoutTypes,
  });

  const weeklyRecordId = currentWeekData.recordId;

  const handleFeedbackSave = async (feedback: string) => {
    if (!weeklyRecordId) return alert('주간 운동 데이터 ID가 없습니다.');

    setSaving(true);
    setIsDisable(true);
    setShowAlert(true);

    try {
      const res = await fetch('/api/workout-feedback', {
        method: 'POST',
        body: JSON.stringify({
          workout_weekly_records_id: weeklyRecordId,
          coach_feedback: feedback,
          challenge_id: challengeId,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || '저장 실패');

      setCoachFeedback(result.data.coach_feedback || '');

      setTimeout(() => {
        setShowAlert(false);
        setIsDisable(false);
      }, 3000);
    } catch (e) {
      console.error('저장 중 에러:', e);
      alert('피드백 저장에 실패했습니다.');
      setShowAlert(false);
      setIsDisable(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex w-full p-4">
      <div className="w-full md:w-4/6 mr-2 flex flex-col gap-5">
        <div className="font-bold mb-1">
          {fetchedUserName || userData.name} 님의 운동현황
        </div>
        <div className="w-1/3 sm:w-full">
          <TotalFeedbackCounts
            counts={`${totalPoints.toFixed(1)}pt`}
            title="총 운동포인트"
            borderColor="border-blue-500"
            textColor="text-blue-500"
          />
        </div>
        <div className="font-bold mb-4">주간운동 그래프</div>
        <div>
          <WeeklyWorkoutChart
            userName={userData.name}
            weeklyWorkouts={userData.weeklyWorkouts}
            userId={userId}
            weekNumberParam={weekNumberParam}
            fetchedUserName={fetchedUserName}
            username={userData.username}
          />

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="font-bold mb-4">
              W{weekNumberParam} 운동 그래프 ({currentWeekData.label})
            </div>
            <div className="flex gap-6 mb-6 sm:flex-col sm:gap-6">
              <div className="flex flex-col items-center w-1/3 sm:w-full">
                <div className="relative w-full">
                  {generateDonutChart(
                    currentWeekData.workoutTypes,
                    false,
                    currentWeekData.totalAchievement
                  )}
                </div>
                <div className="flex justify-between text-sm mt-4 w-full bg-gray-8 px-[1.875rem] py-[1.25rem] md:px-[0.7rem] ">
                  <div className="text-gray-500 ">근력 운동</div>
                  <div className="text-blue-500 text-2.5-900 pt-5 md:text-1.5-900">
                    {currentWeekData.totalSessions || 0}
                    <span className="text-1.75-900 md:text-1.25-900">/2회</span>
                  </div>
                </div>
                <button
                  className="pt-[6rem] text-gray-400 font-bold hover:font-extrabold cursor-pointer sm:px-[2rem] sm:hidden lg:block md:block"
                  onClick={handleBack}
                >
                  ← 목록으로
                </button>
              </div>
              <div className="flex flex-col w-2/3 sm:w-full sm:items-start ">
                <div className="flex items-end mb-4">
                  {generateBarChart(
                    currentWeekData.dailyWorkouts,
                    currentWeekData.totalSessions
                  )}
                </div>
                <div>
                  <TextBox
                    title="코치 피드백"
                    value={coachFeedback}
                    placeholder="피드백을 작성하세요."
                    button1="남기기"
                    Btn1className="bg-green text-white"
                    svg1="/svg/send.svg"
                    onChange={(e) => setCoachFeedback(e.target.value)}
                    onSave={async (feedback) => {
                      await handleFeedbackSave(feedback);
                    }}
                    isFeedbackMode={true}
                    copyIcon
                  />
                </div>
                <button
                  className="pt-[6rem] text-gray-400 font-bold hover:font-extrabold cursor-pointer sm:px-[2rem] sm:block lg:hidden md:hidden"
                  onClick={handleBack}
                >
                  ← 목록으로
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CustomAlert
        message={
          copyMessage
            ? '복사가 완료되었습니다.'
            : isDisable
            ? '피드백 작성이 완료되었습니다.'
            : '피드백 작성이 실패했습니다.'
        }
        isVisible={showAlert || copyMessage}
        onClose={() => {
          setShowAlert(false);
          setCopyMessage(false);
          setIsDisable(false);
        }}
      />
    </div>
  );
}
