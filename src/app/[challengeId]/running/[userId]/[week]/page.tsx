'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRunningData } from '@/components/hooks/useRunningData';
import { useChallengeMembers } from '@/components/hooks/useChallengeMembers';
import TotalFeedbackCounts from '@/components/totalCounts/totalFeedbackCount';
import WeeklyWorkoutChart from '@/components/workoutDashboard/weeklyWorkoutChart';
import TextBox from '@/components/textBox';
import { CustomAlert } from '@/components/layout/customAlert';
import {
  generateBarChart,
  generateDonutChart,
} from '@/components/graph/generateCharts';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IoRefresh } from 'react-icons/io5';
import { DonutChartSkeleton, BarChartSkeleton, RunningListSkeleton } from '@/components/runningpage/RunningDetailSkeleton';

const useUserInfo = (userId: string) => {
  const [name, setName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/user?userId=${userId}&t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
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

export default function MobileRunningDetail() {
  const params = useParams();
  const userId = params.userId as string;
  const challengeId = params.challengeId as string;
  const weekNumberParam = parseInt(params.week as string);
  const searchParams = useSearchParams();
  const weekLabelParam = searchParams.get('label');

  const [componentKey, setComponentKey] = useState(0);

  useEffect(() => {
    setComponentKey(prev => prev + 1);
  }, [userId, challengeId, weekNumberParam, weekLabelParam]);

  const router = useRouter();
  const { members, loading: membersLoading } = useChallengeMembers(challengeId);

  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [coachFeedback, setCoachFeedback] = useState('');
  const [originalFeedback, setOriginalFeedback] = useState('');
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [feedbackDate, setFeedbackDate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [copyMessage, setCopyMessage] = useState(false);
  const [isDisable, setIsDisable] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showWeekDropdown, setShowWeekDropdown] = useState(false);
  const [challengeTitle, setChallengeTitle] = useState<string>('');
  const [challengeInfo, setChallengeInfo] = useState<any>(null);
  const [weekWorkouts, setWeekWorkouts] = useState<any[]>([]);
  const [updatedDailyWorkouts, setUpdatedDailyWorkouts] = useState<any[]>([]);
  const [updatedWorkoutTypes, setUpdatedWorkoutTypes] = useState<any>({});
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingWeekData, setIsLoadingWeekData] = useState(false);

  const memberDropdownRef = useRef<HTMLDivElement>(null);
  const weekDropdownRef = useRef<HTMLDivElement>(null);

  const {
    userData,
    loading,
    error: apiError,
    totalPoints,
    refetch: refetchRunningData,
  } = useRunningData(userId, challengeId);
  const { name: fetchedUserName } = useUserInfo(userId);

  useEffect(() => {
    if (
      !userData ||
      !userData.weeklyRunnings.length ||
      isNaN(weekNumberParam)
    ) {
      setCurrentWeekIndex(0);
      return;
    }

    const foundIndex = userData.weeklyRunnings.findIndex(
      (week) => week.weekNumber === weekNumberParam
    );

    setCurrentWeekIndex(foundIndex >= 0 ? foundIndex : 0);
  }, [userData, weekNumberParam]);

  useEffect(() => {
    const currentWeek = userData?.weeklyRunnings?.find(
      week => week.weekNumber === weekNumberParam
    );

    const weeklyRecordId = currentWeek?.recordId;
    if (!weeklyRecordId) return;

    const fetchCoachFeedback = async () => {
      const res = await fetch(
        `/api/workout-feedback?workout_weekly_records_id=${weeklyRecordId}&challenge_id=${challengeId}&t=${Date.now()}&r=${Math.random()}`,
        {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
      const data = await res.json();
      if (res.ok && data.data) {
        const feedback = data.data.coach_feedback || '';
        setCoachFeedback(feedback);
        setOriginalFeedback(feedback);
        setFeedbackId(data.data.id);
        setFeedbackDate(data.data.updated_at || data.data.created_at);
        setHasUnsavedChanges(false);
      } else {
        setCoachFeedback('');
        setOriginalFeedback('');
        setFeedbackId(null);
        setFeedbackDate(null);
        setHasUnsavedChanges(false);
      }
    };

    fetchCoachFeedback();
  }, [userData, weekLabelParam, challengeId]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setShowMemberDropdown(false);
    setShowWeekDropdown(false);
    setSearchQuery('');
  }, [params, challengeId]);

  useEffect(() => {
    setHasUnsavedChanges(coachFeedback !== originalFeedback);
  }, [coachFeedback, originalFeedback]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '저장되지 않은 변경사항이 있습니다. 페이지를 떠나시겠습니까?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const fetchChallengeInfo = async () => {
      try {
        const res = await fetch(`/api/challenges?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        const data = await res.json();
        if (data && data.length > 0) {
          const challenge = data.find((c: any) => c.challenges.id === challengeId);
          if (challenge) {
            setChallengeTitle(challenge.challenges.title);
            setChallengeInfo(challenge.challenges);
          }
        }
      } catch (error) {
        // console.error('Failed to fetch challenge info:', error);
      }
    };

    if (challengeId) {
      fetchChallengeInfo();
    }
  }, [challengeId]);

  const fetchWeekWorkouts = async () => {
    if (!userData || !weekLabelParam) return;

    setWeekWorkouts([]);
    setUpdatedDailyWorkouts([]);
    setUpdatedWorkoutTypes({});
    setIsLoadingWeekData(true);

    try {
      const [startStr, endStr] = weekLabelParam.split('-');
      const currentYear = new Date().getFullYear();
      const [startMonth, startDay] = startStr.split('.');
      const [endMonth, endDay] = endStr.split('.');

      const startDate = `${currentYear}-${startMonth.padStart(2, '0')}-${startDay.padStart(2, '0')}T00:00:00`;
      const endDate = `${currentYear}-${endMonth.padStart(2, '0')}-${endDay.padStart(2, '0')}T23:59:59`;

      const res = await fetch(
        `/api/workouts?userId=${userId}&startDate=${startDate}&endDate=${endDate}&_t=${Date.now()}&_r=${Math.random()}&_key=${componentKey}`,
        {
          cache: 'no-store',
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate, private',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Request-ID': `${Date.now()}-${Math.random()}`
          }
        }
      );

      if (res.ok) {
        const data = await res.json();
        const workouts = data.workouts || [];
        setWeekWorkouts(workouts);

        const processedDailyWorkouts = processWorkoutsToDaily(workouts);
        setUpdatedDailyWorkouts(processedDailyWorkouts);

        const processedWorkoutTypes = processWorkoutsToTypes(workouts);
        setUpdatedWorkoutTypes(processedWorkoutTypes);
      }
    } catch (error) {
      setWeekWorkouts([]);
      setUpdatedDailyWorkouts([]);
      setUpdatedWorkoutTypes({});
    } finally {
      setIsLoadingWeekData(false);
    }
  };

  useEffect(() => {
    fetchWeekWorkouts();
  }, [userData, weekLabelParam, userId, challengeId, weekNumberParam, componentKey]);


  const processWorkoutsToTypes = (workouts: any[]) => {
    const workoutTypesByCategory: Record<string, number> = {};

    workouts.forEach(workout => {
      if (workout.type === 'CARDIO') {
        const category = workout.category || '기타';
        workoutTypesByCategory[category] = (workoutTypesByCategory[category] || 0) + (workout.points || 0);
      }
    });

    return workoutTypesByCategory;
  };

  const processWorkoutsToDaily = (workouts: any[]) => {
    if (!weekLabelParam) return [];

    const [startStr, endStr] = weekLabelParam.split('-');
    const currentYear = new Date().getFullYear();
    const [startMonth, startDay] = startStr.split('.');
    const [endMonth, endDay] = endStr.split('.');

    const startDate = new Date(Date.UTC(currentYear, parseInt(startMonth) - 1, parseInt(startDay)));
    const endDate = new Date(Date.UTC(currentYear, parseInt(endMonth) - 1, parseInt(endDay)));

    const workoutsByDate = workouts.reduce((acc: Record<string, any[]>, workout: any) => {
      const originalTime = new Date(workout.startTime);
      const actualTime = new Date(originalTime.getTime() - (9 * 60 * 60 * 1000));
      const dateStr = actualTime.toISOString().split('T')[0];

      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(workout);
      return acc;
    }, {});

    const weekdays = ['월', '화', '수', '목', '금', '토', '일'];
    const dailyWorkouts = [];

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const dateStr = currentDate.toISOString().split('T')[0];
      const dayWorkouts = workoutsByDate[dateStr] || [];

      const cardio = dayWorkouts
        .filter(w => w.type === 'CARDIO')
        .reduce((sum, w) => sum + (w.points || 0), 0);

      const strength = dayWorkouts.filter(w => w.type === 'STRENGTH').length;

      dailyWorkouts.push({
        day: weekdays[i],
        date: dateStr,
        value: Math.round(cardio * 100) / 100,
        hasStrength: strength > 0,
        strengthCount: strength,
        status: (weekdays[i] === '토' || weekdays[i] === '일')
          ? 'rest' as const
          : (cardio > 0)
          ? 'complete' as const
          : 'incomplete' as const
      });
    }

    return dailyWorkouts;
  };

  const handleBack = () =>
    router.push(`/${params.challengeId}/running`);

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

  const currentWeekData = userData.weeklyRunnings.find(
    (week) => week.weekNumber === weekNumberParam
  ) || {
    recordId: '',
    label: weekLabelParam || '데이터 없음',
    weekNumber: weekNumberParam,
    dailyRunnings: [
      { day: '월', value: 0, status: 'incomplete', hasStrength: false, strengthCount: 0 },
      { day: '화', value: 0, status: 'incomplete', hasStrength: false, strengthCount: 0 },
      { day: '수', value: 0, status: 'incomplete', hasStrength: false, strengthCount: 0 },
      { day: '목', value: 0, status: 'incomplete', hasStrength: false, strengthCount: 0 },
      { day: '금', value: 0, status: 'incomplete', hasStrength: false, strengthCount: 0 },
      { day: '토', value: 0, status: 'rest', hasStrength: false, strengthCount: 0 },
      { day: '일', value: 0, status: 'rest', hasStrength: false, strengthCount: 0 }
    ],
    feedback: {
      text: '피드백이 아직 없습니다.',
      author: 'AI 코치',
      date: new Date().toISOString(),
    },
    totalSessions: 0,
    requiredSessions: 2,
    totalAchievement: 0,
  };

  const weeklyRecordId = currentWeekData.recordId;

  const filteredMembers = members.filter((member) => {
    const name = member.users.name || member.users.username || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const currentMemberIndex = members.findIndex(
    (member) => member.service_user_id === userId
  );

  const navigateToMember = (direction: 'prev' | 'next') => {
    if (members.length === 0) return;

    setShowMemberDropdown(false);
    setShowWeekDropdown(false);
    setSearchQuery('');

    let newIndex;
    if (direction === 'prev') {
      newIndex = currentMemberIndex > 0 ? currentMemberIndex - 1 : members.length - 1;
    } else {
      newIndex = currentMemberIndex < members.length - 1 ? currentMemberIndex + 1 : 0;
    }

    const newMember = members[newIndex];
    const weekLabel = searchParams.get('label');
    router.push(
      `/${challengeId}/running/${newMember.service_user_id}/${weekNumberParam}${weekLabel ? `?label=${weekLabel}` : ''}`
    );
  };

  const handleMemberSelect = (selectedUserId: string) => {
    const weekLabel = searchParams.get('label');
    router.push(
      `/${challengeId}/running/${selectedUserId}/${weekNumberParam}${weekLabel ? `?label=${weekLabel}` : ''}`
    );
    setShowMemberDropdown(false);
  };

  const handleWeekSelect = (weekNumber: number, label: string) => {
    router.push(
      `/${challengeId}/running/${userId}/${weekNumber}?label=${label}`
    );
    setShowWeekDropdown(false);
  };

  const toggleWorkoutDetails = (workoutId: string) => {
    const newExpanded = new Set(expandedWorkouts);
    if (newExpanded.has(workoutId)) {
      newExpanded.delete(workoutId);
    } else {
      newExpanded.add(workoutId);
    }
    setExpandedWorkouts(newExpanded);
  };

  const formatDuration = (workout: any, category?: string) => {
    const durationSeconds = workout.durationSeconds;
    const durationMinutes = workout.durationMinutes;

    if (durationSeconds && durationSeconds > 0) {
      const minutes = Math.floor(durationSeconds / 60);
      const remainingSeconds = durationSeconds % 60;

      const formattedSeconds = category === '수영'
        ? remainingSeconds.toFixed(2)
        : Math.round(remainingSeconds).toString();

      if (minutes === 0) return `${formattedSeconds}초`;
      if (remainingSeconds === 0) return `${minutes}분`;
      return `${minutes}분 ${formattedSeconds}초`;
    } else if (durationMinutes && durationMinutes > 0) {
      return `${durationMinutes}분`;
    }

    return '-';
  };

  const getIntensityLabel = (intensity: number) => {
    if (!intensity) return null;
    return `Zone ${intensity}`;
  };

  const formatFeedbackDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return `오늘 ${date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays === 1) {
      return `어제 ${date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays < 7) {
      return `${diffInDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

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

      const savedFeedback = result.data.coach_feedback || '';
      setCoachFeedback(savedFeedback);
      setOriginalFeedback(savedFeedback);
      setFeedbackDate(result.data.updated_at || result.data.created_at);
      setHasUnsavedChanges(false);

      setTimeout(() => {
        setShowAlert(false);
        setIsDisable(false);
      }, 3000);
    } catch (e) {
      alert('피드백 저장에 실패했습니다.');
      setShowAlert(false);
      setIsDisable(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div key={`${userId}-${challengeId}-${weekNumberParam}-${weekLabelParam}-${componentKey}`}>
      <style jsx>{`
        .workout-card-hover:hover .hover-tooltip {
          opacity: 1 !important;
          visibility: visible !important;
        }
        .workout-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .workout-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .workout-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .workout-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      <div className="flex w-full">
      <div className="w-full flex flex-col gap-5 mx-2">

        {/* PC 버전 헤더 */}
        <div className="hidden lg:flex flex-col px-8 pt-4 sm:px-4 sm:pt-4">
          {challengeInfo && (
            <div className="text-0.875-400 text-gray-6 mb-2">
              {new Date(challengeInfo.start_date).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} - {new Date(challengeInfo.end_date).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          )}
          <div className="text-gray-2 text-1.25-700">
            {challengeTitle || ''}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="sm:text-1.5-700 lg:text-1.75-700 font-bold text-gray-900 dark:text-white">
                {fetchedUserName || userData.name}님의 W{currentWeekData.weekNumber || weekNumberParam} 운동 현황
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  setIsRefreshing(true);
                  setWeekWorkouts([]);
                  setUpdatedDailyWorkouts([]);
                  setUpdatedWorkoutTypes({});
                  setCoachFeedback('');
                  setFeedbackDate(null);
                  try {
                    await refetchRunningData();
                    setTimeout(async () => {
                      await fetchWeekWorkouts();
                    }, 100);
                  } finally {
                    setTimeout(() => setIsRefreshing(false), 600);
                  }
                }}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="데이터 새로고침"
              >
                <IoRefresh
                  className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                {isRefreshing ? '새로고침 중...' : '새로고침'}
              </button>
              <button
                onClick={() => navigateToMember('prev')}
                className="p-2 bg-white hover:bg-blue-50 rounded-lg transition-all duration-200 shadow-sm hover:shadow border border-gray-200 hover:border-blue-200"
                disabled={members.length === 0}
              >
                <ChevronLeft className="w-4 h-4 text-gray-700" />
              </button>

              <div className="relative" ref={memberDropdownRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMemberDropdown(!showMemberDropdown);
                    setShowWeekDropdown(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-blue-50 rounded-lg transition-all duration-200 shadow-sm hover:shadow border border-gray-200 hover:border-blue-200"
                >
                  <span className="font-medium text-gray-800">
                    {fetchedUserName || userData.name}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      showMemberDropdown ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showMemberDropdown && (
                  <div className="absolute top-full right-0 mt-3 w-72 bg-white rounded-xl shadow-xl border border-gray-100 max-h-96 overflow-hidden z-50">
                    <div className="sticky top-0 bg-white border-b border-gray-100">
                      <div className="p-3">
                        <input
                          type="text"
                          placeholder="🔍 이름으로 검색"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="px-4 py-2 bg-gray-50">
                        <span className="text-xs font-medium text-gray-600">
                          {searchQuery ? `${filteredMembers.length}명 검색됨` : `전체 ${members.length}명`}
                        </span>
                      </div>
                    </div>
                    {membersLoading ? (
                      <div className="p-4 text-center text-gray-500">
                        로딩 중...
                      </div>
                    ) : filteredMembers.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        검색 결과가 없습니다
                      </div>
                    ) : (
                      <div className="overflow-y-auto max-h-60">
                        {filteredMembers.map((member) => (
                          <button
                            key={member.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMemberSelect(member.service_user_id);
                              setSearchQuery('');
                            }}
                            className={`w-full px-4 py-3 text-left transition-all duration-150 border-b border-gray-50 ${
                              member.service_user_id === userId
                                ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 font-semibold'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <span className="font-medium">
                              {member.users.name || member.users.username}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => navigateToMember('next')}
                className="p-2 bg-white hover:bg-blue-50 rounded-lg transition-all duration-200 shadow-sm hover:shadow border border-gray-200 hover:border-blue-200"
                disabled={members.length === 0}
              >
                <ChevronRight className="w-4 h-4 text-gray-700" />
              </button>

              <div className="relative" ref={weekDropdownRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowWeekDropdown(!showWeekDropdown);
                    setShowMemberDropdown(false);
                    setSearchQuery('');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-blue-50 rounded-lg transition-all duration-200 shadow-sm hover:shadow border border-gray-200 hover:border-blue-200"
                >
                  <span className="font-medium text-gray-800">W{currentWeekData.weekNumber || weekNumberParam}</span>
                  <span className="text-xs text-gray-400">{currentWeekData.label}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      showWeekDropdown ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showWeekDropdown && (
                  <div className="absolute top-full right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-100 max-h-72 overflow-y-auto z-50">
                    <div className="py-2">
                      {userData?.weeklyRunnings.map((week) => (
                        <button
                          key={week.recordId}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWeekSelect(week.weekNumber, week.label);
                          }}
                          className={`w-full px-4 py-3 text-left transition-all duration-150 border-b border-gray-50 ${
                            week.weekNumber === weekNumberParam
                              ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div>
                            <span className="font-semibold">W{week.weekNumber}</span>
                            <span className="text-xs text-gray-400 ml-2">{week.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 모바일 버전 헤더 */}
        <div className="flex flex-col lg:hidden px-8 pt-4 sm:px-4 sm:pt-4 text-center">
          {challengeInfo && (
            <div className="text-0.875-400 text-gray-6 mb-2">
              {new Date(challengeInfo.start_date).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} - {new Date(challengeInfo.end_date).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          )}
          <div className="text-gray-2 text-1.25-700">
            {challengeTitle || ''}
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="sm:text-1.5-700 lg:text-1.75-700 font-bold text-gray-900 dark:text-white">
              {fetchedUserName || userData.name}님의 W{currentWeekData.weekNumber || weekNumberParam} 운동 현황
            </h1>
          </div>
        </div>

        {/* 모바일 네비게이션 */}
        <div className="flex flex-col gap-4 lg:hidden px-8 pt-4 sm:px-4 sm:pt-4">
          <div className="flex justify-center">
            <button
              onClick={async () => {
                setIsRefreshing(true);
                setWeekWorkouts([]);
                setUpdatedDailyWorkouts([]);
                setUpdatedWorkoutTypes({});
                setCoachFeedback('');
                setFeedbackDate(null);
                try {
                  await refetchRunningData();
                  setTimeout(async () => {
                    await fetchWeekWorkouts();
                  }, 100);
                } finally {
                  setTimeout(() => setIsRefreshing(false), 600);
                }
              }}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="데이터 새로고침"
            >
              <IoRefresh
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              {isRefreshing ? '새로고침 중...' : '새로고침'}
            </button>
          </div>
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={() => navigateToMember('prev')}
              className="p-2.5 bg-white hover:bg-blue-50 rounded-lg transition-all duration-200 shadow-sm hover:shadow border border-gray-200 hover:border-blue-200"
              disabled={members.length === 0}
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>

            <div className="relative flex-1" ref={memberDropdownRef}>
              <button
                onClick={() => {
                  setShowMemberDropdown(!showMemberDropdown);
                  setShowWeekDropdown(false);
                }}
                className="flex items-center justify-between px-5 py-3 bg-white hover:bg-blue-50 rounded-lg transition-all duration-200 w-full shadow-sm hover:shadow border border-gray-200 hover:border-blue-200"
              >
                <div className="flex-1 text-center">
                  <span className="font-semibold text-gray-800">
                    {fetchedUserName || userData.name}
                  </span>
                </div>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    showMemberDropdown ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showMemberDropdown && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 w-72 bg-white rounded-xl shadow-xl border border-gray-100 max-h-96 overflow-hidden z-50">
                  <div className="sticky top-0 bg-white border-b border-gray-100">
                    <div className="p-3">
                      <input
                        type="text"
                        placeholder="🔍 이름으로 검색"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="px-4 py-2 bg-gray-50">
                      <span className="text-xs font-medium text-gray-600">
                        {searchQuery ? `${filteredMembers.length}명 검색됨` : `전체 ${members.length}명`}
                      </span>
                    </div>
                  </div>
                  {membersLoading ? (
                    <div className="p-4 text-center text-gray-500">로딩 중...</div>
                  ) : filteredMembers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">검색 결과가 없습니다</div>
                  ) : (
                    <div className="overflow-y-auto max-h-60">
                      {filteredMembers.map((member) => (
                        <button
                          key={member.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMemberSelect(member.service_user_id);
                            setSearchQuery('');
                          }}
                          className={`w-full px-4 py-3 text-left transition-all duration-150 border-b border-gray-50 ${
                            member.service_user_id === userId
                              ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 font-semibold'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <span className="font-medium">
                            {member.users.name || member.users.username}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => navigateToMember('next')}
              className="p-2.5 bg-white hover:bg-blue-50 rounded-lg transition-all duration-200 shadow-sm hover:shadow border border-gray-200 hover:border-blue-200"
              disabled={members.length === 0}
            >
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </button>
          </div>

          <div className="h-px w-full bg-gray-200"></div>

          <div className="relative w-full flex justify-center" ref={weekDropdownRef}>
            <button
              onClick={() => {
                setShowWeekDropdown(!showWeekDropdown);
                setShowMemberDropdown(false);
                setSearchQuery('');
              }}
              className="flex items-center justify-between px-5 py-3 bg-white hover:bg-blue-50 rounded-lg transition-all duration-200 shadow-sm hover:shadow border border-gray-200 hover:border-blue-200 w-full"
            >
              <div className="flex-1 text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="font-semibold text-gray-800">W{currentWeekData.weekNumber || weekNumberParam}</span>
                  <span className="text-xs text-gray-400">{currentWeekData.label}</span>
                </div>
              </div>
              <svg
                className={`w-4 h-4 transition-transform ${
                  showWeekDropdown ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showWeekDropdown && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-100 max-h-72 overflow-y-auto z-50">
                <div className="py-2">
                  {userData?.weeklyRunnings.map((week) => (
                    <button
                      key={week.recordId}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWeekSelect(week.weekNumber, week.label);
                      }}
                      className={`w-full px-4 py-3 text-left transition-all duration-150 border-b border-gray-50 ${
                        week.weekNumber === weekNumberParam
                          ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-semibold">W{week.weekNumber}</span>
                      <span className="text-xs text-gray-400 ml-2">{week.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <WeeklyWorkoutChart
            userName={userData.name}
            weeklyWorkouts={userData.weeklyRunnings}
            userId={userId}
            weekNumberParam={weekNumberParam}
            fetchedUserName={fetchedUserName}
            username={(userData as any)?.username || ''}
          />

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="font-bold mb-4">
              W{currentWeekData.weekNumber || weekNumberParam} <span className="text-gray-500 font-normal">{currentWeekData.label}</span>
            </div>
            <div className="sm:flex sm:flex-col sm:gap-6 lg:grid lg:grid-cols-3 lg:gap-6">

              <div className="sm:w-full lg:col-span-1 flex flex-col lg:px-4">
                <div className="mb-4">
                  <div className="relative w-full flex justify-center">
                    {isLoadingWeekData ? (
                      <DonutChartSkeleton />
                    ) : (
                      generateDonutChart(
                        updatedWorkoutTypes,
                        false,
                        Math.round(Object.values(updatedWorkoutTypes).reduce((sum: number, val: any) => sum + val, 0) * 100) / 100
                      )
                    )}
                  </div>
                </div>

                <div className="mb-4 bg-gray-50 px-6 py-6 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">근력 운동</div>
                    <div className="text-blue-500 flex items-baseline gap-1">
                      <span className="text-6xl font-bold leading-none">{currentWeekData.totalSessions || 0}</span>
                      <span className="text-base font-bold">/2회</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex items-end">
                  {isLoadingWeekData ? (
                    <BarChartSkeleton />
                  ) : (
                    generateBarChart(
                      updatedDailyWorkouts.length > 0 ? updatedDailyWorkouts : currentWeekData.dailyRunnings,
                      currentWeekData.totalSessions
                    )
                  )}
                </div>
              </div>

              <div className="sm:w-full lg:col-span-1 flex flex-col">
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 flex justify-between items-center">
                  <span>운동 기록</span>
                  {weekWorkouts.length > 0 && (
                    <span className="text-gray-400 text-[10px]">총 {weekWorkouts.length}개</span>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto max-h-[450px] workout-scroll">
                  {isLoadingWeekData ? (
                    <RunningListSkeleton />
                  ) : weekWorkouts.length > 0 ? (
                    <div className="space-y-2 pr-2">
                      {weekWorkouts.map((workout, index) => {
                        const workoutId = workout.id || `workout-${index}`;
                        const isExpanded = expandedWorkouts.has(workoutId);

                        const isStrength = workout.type === 'STRENGTH';
                        const borderColor = isStrength ? 'border-orange-400' : 'border-[#26CBFF]';
                        const bgColor = isStrength ? 'bg-orange-50' : 'bg-blue-50';
                        const hoverBgColor = isStrength ? 'hover:bg-orange-100' : 'hover:bg-blue-100';

                        return (
                          <div
                            key={workoutId}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                          >
                            <div
                              className={`border-l-4 ${borderColor} pl-3 pr-3 py-2 ${bgColor} dark:bg-gray-800 cursor-pointer ${hoverBgColor} dark:hover:bg-gray-700 transition-colors relative workout-card-hover`}
                              onClick={() => toggleWorkoutDetails(workoutId)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                                    {workout.title}
                                  </div>
                                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                    {workout.category}
                                  </div>
                                  <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-1">
                                    {(() => {
                                      const originalTime = new Date(workout.startTime);
                                      const actualTime = new Date(originalTime.getTime() - (9 * 60 * 60 * 1000));
                                      const timeString = `${actualTime.toLocaleDateString('ko-KR', {
                                        month: 'numeric',
                                        day: 'numeric',
                                        weekday: 'short'
                                      })} ${actualTime.toLocaleTimeString('ko-KR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}`;
                                      const duration = formatDuration(workout, workout.category);
                                      return `${timeString} • ${duration}`;
                                    })()}
                                  </div>
                                </div>
                                <div className="text-right flex items-center gap-2">
                                  <div>
                                    {!isStrength && (
                                      <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                        {workout.points.toFixed(1)}pt
                                      </div>
                                    )}
                                    {workout.type === 'STRENGTH' && (
                                      <div className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
                                        근력
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-gray-400">
                                    <svg
                                      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </div>
                                </div>
                              </div>

                              {workout.note && (
                                <div className="absolute bottom-2 right-8">
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                                    노트
                                  </span>
                                </div>
                              )}
                            </div>

                            {isExpanded && (
                              <div className="px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                                <div className="grid grid-cols-1 gap-2 text-[11px]">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">운동시간:</span>
                                    <span className="font-medium text-gray-800 dark:text-gray-200">
                                      {formatDuration(workout, workout.category)}
                                    </span>
                                  </div>

                                  <div className="flex justify-between">
                                    <span className="text-gray-500">강도:</span>
                                    <span className="font-medium text-orange-600 dark:text-orange-400">
                                      {workout.intensity ? `Zone ${workout.intensity}` : '-'}
                                    </span>
                                  </div>

                                  <div className="flex justify-between">
                                    <span className="text-gray-500">평균심박수:</span>
                                    <span className="font-medium text-gray-800 dark:text-gray-200">
                                      {workout.avgHeartRate ? `${workout.avgHeartRate} bpm` : '-'}
                                    </span>
                                  </div>

                                  <div className="flex justify-between">
                                    <span className="text-gray-500">최대심박수:</span>
                                    <span className="font-medium text-gray-800 dark:text-gray-200">
                                      {workout.maxHeartRate ? `${workout.maxHeartRate} bpm` : '-'}
                                    </span>
                                  </div>
                                </div>

                                {workout.note && (
                                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <div className="text-[11px]">
                                      <span className="text-gray-500 font-medium">노트:</span>
                                      <p className="mt-1 text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                        {workout.note}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 text-center py-4">
                      이번 주 운동 기록이 없습니다.
                    </div>
                  )}
                </div>
              </div>

              <div className="sm:w-full lg:col-span-1 flex flex-col sm:min-h-[600px] lg:min-h-0">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    코치 피드백
                  </div>
                  {feedbackDate && (
                    <div className="text-[10px] text-gray-400">
                      {formatFeedbackDate(feedbackDate)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <TextBox
                    title=""
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
                    className="h-full"
                    disabled={!hasUnsavedChanges || saving}
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

        <div className="flex justify-start px-4 pt-4">
          <button
            className="text-gray-400 font-bold hover:font-extrabold cursor-pointer sm:hidden lg:block md:block"
            onClick={handleBack}
          >
            ← 목록으로
          </button>
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
    </div>
  );
}
