'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWorkoutData } from '@/components/hooks/useWorkoutData';
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
  const { members, loading: membersLoading } = useChallengeMembers(challengeId);

  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [coachFeedback, setCoachFeedback] = useState('');
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copyMessage, setCopyMessage] = useState(false);
  const [isDisable, setIsDisable] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showWeekDropdown, setShowWeekDropdown] = useState(false);
  const [challengeTitle, setChallengeTitle] = useState<string>('');
  const [challengeInfo, setChallengeInfo] = useState<any>(null);
  
  const memberDropdownRef = useRef<HTMLDivElement>(null);
  const weekDropdownRef = useRef<HTMLDivElement>(null);

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
    // 페이지 변경 시 드롭다운 상태 초기화
    setShowMemberDropdown(false);
    setShowWeekDropdown(false);
    setSearchQuery('');
  }, [params, challengeId]);

  // 외부 클릭 및 ESC 키 핸들러 (임시 비활성화)
  // useEffect(() => {
  //   const handleClickOutside = (event: Event) => {
  //     const target = event.target as Node;
      
  //     if (memberDropdownRef.current && !memberDropdownRef.current.contains(target)) {
  //       setShowMemberDropdown(false);
  //       setSearchQuery('');
  //     }
  //     if (weekDropdownRef.current && !weekDropdownRef.current.contains(target)) {
  //       setShowWeekDropdown(false);
  //     }
  //   };

  //   const handleEscKey = (event: KeyboardEvent) => {
  //     if (event.key === 'Escape') {
  //       setShowMemberDropdown(false);
  //       setShowWeekDropdown(false);
  //       setSearchQuery('');
  //     }
  //   };

  //   // mousedown 이벤트 사용
  //   document.addEventListener('mousedown', handleClickOutside);
  //   document.addEventListener('keydown', handleEscKey);

  //   return () => {
  //     document.removeEventListener('mousedown', handleClickOutside);
  //     document.removeEventListener('keydown', handleEscKey);
  //   };
  // }, []);

  // 챌린지 정보 가져오기
  useEffect(() => {
    const fetchChallengeInfo = async () => {
      try {
        const res = await fetch(`/api/challenges`);
        const data = await res.json();
        if (data && data.length > 0) {
          const challenge = data.find((c: any) => c.challenges.id === challengeId);
          if (challenge) {
            setChallengeTitle(challenge.challenges.title);
            setChallengeInfo(challenge.challenges);
          }
        }
      } catch (error) {
        console.error('Failed to fetch challenge info:', error);
      }
    };
    
    if (challengeId) {
      fetchChallengeInfo();
    }
  }, [challengeId]);

  const handleBack = () =>
    router.push(`/${params.challengeId}/workout`);

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

  const weeklyRecordId = currentWeekData.recordId;

  // 검색된 멤버 필터링
  const filteredMembers = members.filter((member) => {
    const name = member.users.name || member.users.username || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // 현재 멤버의 인덱스 찾기
  const currentMemberIndex = members.findIndex(
    (member) => member.service_user_id === userId
  );

  // 이전/다음 멤버 네비게이션
  const navigateToMember = (direction: 'prev' | 'next') => {
    if (members.length === 0) return;
    
    // 드롭다운 닫기 및 상태 초기화
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
      `/${challengeId}/workout/${newMember.service_user_id}/${weekNumberParam}${weekLabel ? `?label=${weekLabel}` : ''}`
    );
  };

  // 드롭다운에서 멤버 선택
  const handleMemberSelect = (selectedUserId: string) => {
    const weekLabel = searchParams.get('label');
    router.push(
      `/${challengeId}/workout/${selectedUserId}/${weekNumberParam}${weekLabel ? `?label=${weekLabel}` : ''}`
    );
    setShowMemberDropdown(false);
  };

  // 주차 선택
  const handleWeekSelect = (weekNumber: number, label: string) => {
    router.push(
      `/${challengeId}/workout/${userId}/${weekNumber}?label=${label}`
    );
    setShowWeekDropdown(false);
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
    <div className="flex w-full p-4 sm:p-0">
      <div className="w-full md:w-4/6 mr-2 flex flex-col gap-5">
        
        {/* PC 버전 헤더 - 타이틀과 네비게이션 */}
        <div className="hidden lg:flex flex-col px-8 pt-4 sm:px-4 sm:pt-4">
          {/* 챌린지 기간 표시 */}
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
          {/* 챌린지 이름 */}
          <div className="text-gray-2 text-1.25-700">
            {challengeTitle || ''}
          </div>
          
          {/* 타이틀과 네비게이션 */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="sm:text-1.5-700 lg:text-1.75-700 font-bold text-gray-900 dark:text-white">
                {fetchedUserName || userData.name}님의 W{weekNumberParam} 운동 현황
              </h1>
            </div>
            
            {/* 네비게이션 버튼들 */}
            <div className="flex items-center gap-3">
              {/* 멤버 네비게이션 */}
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
                
                {/* 멤버 드롭다운 */}
                {showMemberDropdown && (
                  <div className="absolute top-full right-0 mt-3 w-72 bg-white rounded-xl shadow-xl border border-gray-100 max-h-96 overflow-hidden z-50">
                    {/* 검색 입력창 */}
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
              
              {/* 주차 선택 드롭다운 */}
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
                  <span className="font-medium text-gray-800">W{weekNumberParam}</span>
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
                
                {/* 주차 드롭다운 */}
                {showWeekDropdown && (
                  <div className="absolute top-full right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-100 max-h-72 overflow-y-auto z-50">
                    <div className="py-2">
                      {userData?.weeklyWorkouts.map((week) => (
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
        
        {/* 모바일 버전 헤더 및 네비게이션 */}
        <div className="flex flex-col lg:hidden px-8 pt-4 sm:px-4 sm:pt-4 text-center">
          {/* 챌린지 기간 표시 */}
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
          {/* 챌린지 이름 */}
          <div className="text-gray-2 text-1.25-700">
            {challengeTitle || ''}
          </div>
          
          {/* 타이틀 */}
          <div className="flex flex-col gap-2">
            <h1 className="sm:text-1.5-700 lg:text-1.75-700 font-bold text-gray-900 dark:text-white">
              {fetchedUserName || userData.name}님의 W{weekNumberParam} 운동 현황
            </h1>
          </div>
        </div>
        
        {/* 모바일 네비게이션 */}
        <div className="flex flex-col gap-4 lg:hidden px-8 pt-4 sm:px-4 sm:pt-4">
          {/* 멤버 네비게이션 */}
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
              
              {/* 모바일 멤버 드롭다운 */}
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
          
          {/* 구분선 */}
          <div className="h-px w-full bg-gray-200"></div>
          
          {/* 주차 선택 드롭다운 */}
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
                  <span className="font-semibold text-gray-800">W{weekNumberParam}</span>
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
            
            {/* 모바일 주차 드롭다운 */}
            {showWeekDropdown && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-100 max-h-72 overflow-y-auto z-50">
                <div className="py-2">
                  {userData?.weeklyWorkouts.map((week) => (
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
            weeklyWorkouts={userData.weeklyWorkouts}
            userId={userId}
            weekNumberParam={weekNumberParam}
            fetchedUserName={fetchedUserName}
            username={(userData as any)?.username || ''}
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