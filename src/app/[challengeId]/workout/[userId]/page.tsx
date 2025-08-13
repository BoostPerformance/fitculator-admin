'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWorkoutData } from '@/components/hooks/useWorkoutData';
import DesktopWorkout from '@/components/workoutpage/desktopWorkout';
import MobileWorkout from '@/components/workoutpage/mobileWorkout';
import WorkoutTable from '@/components/workoutDashboard/workoutTable';

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

function formatMMDD(date: Date) {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${month}.${day}`;
}

function generateWeekLabels(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const weeks: { weekNumber: number; label: string }[] = [];
  let current = new Date(startDate);
  let index = 1;

  while (current <= endDate) {
    const weekStart = new Date(current);
    const weekEnd = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const label = `${formatMMDD(weekStart)}-${formatMMDD(weekEnd)}`;
    weeks.push({ weekNumber: index, label });

    current.setDate(current.getDate() + 7);
    index++;
  }

  return weeks;
}

// NOTE: Removed early return for no data and instead fallback handled in generateDonutChart and generateBarChart

export default function UserWorkoutDetailPage() {
  const params = useParams();
  const userId = params.userId as string;
  const challengeId = params.challengeId as string;
  const router = useRouter();
  const [coachFeedback, setCoachFeedback] = useState('');
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copyMessage, setCopyMessage] = useState(false);
  const [isDisable, setIsDisable] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [weekLabels, setWeekLabels] = useState<
    { weekNumber: number; label: string }[]
  >([]);

  const {
    userData,
    loading,
    error: apiError,
    totalPoints,
  } = useWorkoutData(userId, challengeId);
  const { name: fetchedUserName } = useUserInfo(userId);

  // console.log('userData', userData);

  const { currentWeekIndex, lastWeekIndex } = useMemo(() => {
    if (!userData || !userData.weeklyWorkouts.length)
      return { currentWeekIndex: 0, lastWeekIndex: 0 };
    const today = new Date();
    let currentIdx = 0;
    let lastIdx = Math.max(0, userData.weeklyWorkouts.length - 2);

    userData.weeklyWorkouts.forEach((week, idx) => {
      const dateParts = week.label.split('-');
      if (dateParts.length === 2) {
        const endDateParts = dateParts[1].split('.');
        if (endDateParts.length === 2) {
          const endMonth = parseInt(endDateParts[0]);
          const endDay = parseInt(endDateParts[1]);
          const weekEndDate = new Date(
            today.getFullYear(),
            endMonth - 1,
            endDay
          );
          if (today <= weekEndDate) {
            currentIdx = idx;
            lastIdx = Math.max(0, idx - 1);
          }
        }
      }
    });
    if (userData.weeklyWorkouts.length === 1) currentIdx = lastIdx = 0;
    return { currentWeekIndex: currentIdx, lastWeekIndex: lastIdx };
  }, [userData]);

  const handleBack = () => router.push(`/${params.challengeId}/workout`);

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

    const fetchTotalWeeks = async () => {
      const res = await fetch(
        `/api/workouts?type=challenge-weeks&challengeId=${challengeId}`
      );
      const data = await res.json();
      if (res.ok && data.startDate && data.endDate) {
        setWeekLabels(generateWeekLabels(data.startDate, data.endDate));
      }
    };
    if (challengeId) fetchTotalWeeks();
    fetchCoachFeedback();
  }, [userData, currentWeekIndex, challengeId]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params, challengeId]);

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

  const currentWeekData = userData.weeklyWorkouts?.[currentWeekIndex] || {
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
  };

  const weeklyRecordId = userData?.weeklyWorkouts?.[currentWeekIndex]?.recordId;

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
    <>
      <DesktopWorkout
        userId={userId}
        userData={userData}
        totalPoints={totalPoints}
        currentWeekData={currentWeekData}
        coachFeedback={coachFeedback}
        setCoachFeedback={setCoachFeedback}
        handleFeedbackSave={handleFeedbackSave}
        fetchedUserName={fetchedUserName}
        handleBack={handleBack}
        isDisable={isDisable}
        showAlert={showAlert}
        copyMessage={copyMessage}
        setShowAlert={setShowAlert}
        setCopyMessage={setCopyMessage}
        setIsDisable={setIsDisable}
      />
      <MobileWorkout />
      {/* <WorkoutTable challengeId={params.challengeId as string} /> */}
    </>
  );
}
