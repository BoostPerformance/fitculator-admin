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
import { IoRefresh } from 'react-icons/io5';
import { DonutChartSkeleton, BarChartSkeleton, WorkoutListSkeleton } from '@/components/workoutpage/WorkoutDetailSkeleton';

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

export default function MobileWorkoutDetail() {
 const params = useParams();
 const userId = params.userId as string;
 const challengeId = params.challengeId as string;
 const weekNumberParam = parseInt(params.week as string);
 const searchParams = useSearchParams();
 const weekLabelParam = searchParams.get('label');
 
 // Force re-render key based on all params
 const [componentKey, setComponentKey] = useState(0);
 
 useEffect(() => {
 // Force component re-render when params change
 setComponentKey(prev => prev + 1);
 }, [userId, challengeId, weekNumberParam, weekLabelParam]);

 const router = useRouter();
 const { members, loading: membersLoading } = useChallengeMembers(challengeId);

 const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
 const [coachFeedback, setCoachFeedback] = useState('');
 const [originalFeedback, setOriginalFeedback] = useState('');
 const [aiFeedback, setAiFeedback] = useState('');
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
 // 캐시 제거 - 항상 최신 데이터를 가져오도록 변경
 
 const memberDropdownRef = useRef<HTMLDivElement>(null);
 const weekDropdownRef = useRef<HTMLDivElement>(null);

 const {
 userData,
 loading,
 error: apiError,
 totalPoints,
 refetch: refetchWorkoutData,
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
 // weekNumber로 정확한 주차 데이터 찾기
 const currentWeek = userData?.weeklyWorkouts?.find(
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
 setAiFeedback(data.data.ai_feedback || '');
 setFeedbackId(data.data.id);
 setFeedbackDate(data.data.updated_at || data.data.created_at);
 setHasUnsavedChanges(false);
 } else {
 setCoachFeedback('');
 setOriginalFeedback('');
 setAiFeedback('');
 setFeedbackId(null);
 setFeedbackDate(null);
 setHasUnsavedChanges(false);
 }
 };

 fetchCoachFeedback();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [userData, weekLabelParam, challengeId]);

 useEffect(() => {
 window.scrollTo(0, 0);
 // 페이지 변경 시 드롭다운 상태 초기화
 setShowMemberDropdown(false);
 setShowWeekDropdown(false);
 setSearchQuery('');
 }, [params, challengeId]);

 // 피드백 변경 감지
 useEffect(() => {
 setHasUnsavedChanges(coachFeedback !== originalFeedback);
 }, [coachFeedback, originalFeedback]);

 // 페이지 이탈 시 확인
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

 // 외부 클릭 및 ESC 키 핸들러 (임시 비활성화)
 // useEffect(() => {
 // const handleClickOutside = (event: Event) => {
 // const target = event.target as Node;
 
 // if (memberDropdownRef.current && !memberDropdownRef.current.contains(target)) {
 // setShowMemberDropdown(false);
 // setSearchQuery('');
 // }
 // if (weekDropdownRef.current && !weekDropdownRef.current.contains(target)) {
 // setShowWeekDropdown(false);
 // }
 // };

 // const handleEscKey = (event: KeyboardEvent) => {
 // if (event.key === 'Escape') {
 // setShowMemberDropdown(false);
 // setShowWeekDropdown(false);
 // setSearchQuery('');
 // }
 // };

 // // mousedown 이벤트 사용
 // document.addEventListener('mousedown', handleClickOutside);
 // document.addEventListener('keydown', handleEscKey);

 // return () => {
 // document.removeEventListener('mousedown', handleClickOutside);
 // document.removeEventListener('keydown', handleEscKey);
 // };
 // }, []);

 // 챌린지 정보 가져오기
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

 // 해당 주의 운동 상세 데이터 가져오기 및 요일별 그룹핑 (캐싱 제거)
 const fetchWeekWorkouts = async () => {
 if (!userData || !weekLabelParam) return;
 
 // 데이터 초기화
 setWeekWorkouts([]);
 setUpdatedDailyWorkouts([]);
 setUpdatedWorkoutTypes({});
 setIsLoadingWeekData(true);
 
 try {
 // 주의 시작/종료 날짜 파싱
 const [startStr, endStr] = weekLabelParam.split('-');
 const currentYear = new Date().getFullYear();
 const [startMonth, startDay] = startStr.split('.');
 const [endMonth, endDay] = endStr.split('.');
 
 // 월과 일에 0을 채워서 올바른 날짜 포맷 생성
 const startDate = `${currentYear}-${startMonth.padStart(2, '0')}-${startDay.padStart(2, '0')}T00:00:00`;
 const endDate = `${currentYear}-${endMonth.padStart(2, '0')}-${endDay.padStart(2, '0')}T23:59:59`;
 
 // 운동 데이터 가져오기 - 특정 주만 필터링
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
 
 // 요일별로 운동 데이터 그룹핑하여 dailyWorkouts 업데이트
 const processedDailyWorkouts = processWorkoutsToDaily(workouts);
 setUpdatedDailyWorkouts(processedDailyWorkouts);
 
 // 도넛 그래프용 데이터도 업데이트
 const processedWorkoutTypes = processWorkoutsToTypes(workouts);
 setUpdatedWorkoutTypes(processedWorkoutTypes);
 }
 } catch (error) {
 // console.error('Failed to fetch week workouts:', error);
 setWeekWorkouts([]);
 setUpdatedDailyWorkouts([]);
 setUpdatedWorkoutTypes({});
 } finally {
 setIsLoadingWeekData(false);
 }
 };
 
 useEffect(() => {
 // 페이지 이동이나 파라미터 변경시마다 새로운 데이터 가져오기
 fetchWeekWorkouts();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [userData, weekLabelParam, userId, challengeId, weekNumberParam, componentKey]);


 // 데이터 처리 함수들
 const processWorkoutsToTypes = (workouts: any[]) => {
 const workoutTypesByCategory: Record<string, number> = {};
 
 // CARDIO 운동만 집계
 workouts.forEach(workout => {
 if (workout.type === 'CARDIO') {
 const category = workout.category || '기타';
 workoutTypesByCategory[category] = (workoutTypesByCategory[category] || 0) + (workout.points || 0);
 }
 });

 return workoutTypesByCategory;
 };

 const processWorkoutsToDaily = (workouts: any[]) => {
 // 주차 라벨에서 시작일과 종료일 파싱
 if (!weekLabelParam) return [];
 
 const [startStr, endStr] = weekLabelParam.split('-');
 const currentYear = new Date().getFullYear();
 const [startMonth, startDay] = startStr.split('.');
 const [endMonth, endDay] = endStr.split('.');
 
 // 기준 날짜를 UTC 기준으로 생성 (운동 데이터와 동일한 기준)
 const startDate = new Date(Date.UTC(currentYear, parseInt(startMonth) - 1, parseInt(startDay)));
 const endDate = new Date(Date.UTC(currentYear, parseInt(endMonth) - 1, parseInt(endDay)));

 // 운동 데이터를 날짜별로 그룹핑 (DB는 UTC+9로 저장되어 있으므로 -9시간 조정)
 const workoutsByDate = workouts.reduce((acc: Record<string, any[]>, workout: any) => {
 // startTime에서 9시간을 빼서 실제 운동한 시간 기준 날짜 추출
 const originalTime = new Date(workout.startTime);
 const actualTime = new Date(originalTime.getTime() - (9 * 60 * 60 * 1000));
 const dateStr = actualTime.toISOString().split('T')[0];
 
 // 디버깅: 시간 확인 (첫 번째 운동만)
 if (Object.keys(acc).length === 0 && workouts.length > 0) {
 console.log('🕐 실제 운동 시간으로 -9시간 (startTime):', {
 original_startTime: workout.startTime,
 original_time: originalTime.toISOString(),
 actual_time: actualTime.toISOString(),
 final_date_str: dateStr
 });
 }
 
 if (!acc[dateStr]) acc[dateStr] = [];
 acc[dateStr].push(workout);
 return acc;
 }, {});

 // 7일 구조 생성 (월요일부터 일요일까지)
 const weekdays = ['월', '화', '수', '목', '금', '토', '일'];
 const dailyWorkouts = [];
 
 console.log('📊 바 그래프 데이터 생성 시작');
 console.log('🗓️ 기준 startDate:', startDate.toISOString());
 console.log('🏋️ workoutsByDate keys:', Object.keys(workoutsByDate));
 
 for (let i = 0; i < 7; i++) {
 const currentDate = new Date(startDate);
 currentDate.setDate(startDate.getDate() + i);
 
 const dateStr = currentDate.toISOString().split('T')[0];
 const dayWorkouts = workoutsByDate[dateStr] || [];
 
 const cardio = dayWorkouts
 .filter(w => w.type === 'CARDIO')
 .reduce((sum, w) => sum + (w.points || 0), 0);
 
 const strength = dayWorkouts.filter(w => w.type === 'STRENGTH').length;
 
 console.log(`📅 ${weekdays[i]}(${dateStr}):`, {
 dayWorkouts: dayWorkouts.length,
 cardio,
 strength,
 workoutTitles: dayWorkouts.map(w => w.title)
 });
 
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

 // 실제 운동 데이터로 workoutTypes 업데이트 (도넛 그래프용) - 호환성을 위해 유지
 const updateWorkoutTypesWithRealData = (workouts: any[]) => {
 const result = processWorkoutsToTypes(workouts);
 setUpdatedWorkoutTypes(result);
 };

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
 <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded my-4">
 <h2 className="font-bold">데이터 로딩 오류</h2>
 <p>{apiError}</p>
 </div>
 );
 if (!userData)
 return <div>사용자 데이터를 불러오는 중 오류가 발생했습니다.</div>;

 // weekNumber로 찾기 (URL의 week 파라미터 사용)
 const currentWeekData = userData.weeklyWorkouts.find(
 (week) => week.weekNumber === weekNumberParam
 ) || {
 recordId: '',
 label: weekLabelParam || '데이터 없음',
 weekNumber: weekNumberParam,
 dailyWorkouts: [
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

 // weeklyRecordId는 currentWeekData에서 가져오기
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

 // 운동 상세 정보 토글 함수
 const toggleWorkoutDetails = (workoutId: string) => {
 const newExpanded = new Set(expandedWorkouts);
 if (newExpanded.has(workoutId)) {
 newExpanded.delete(workoutId);
 } else {
 newExpanded.add(workoutId);
 }
 setExpandedWorkouts(newExpanded);
 };

 // 운동 시간 포맷 함수 (duration_seconds 우선, duration_minutes 폴백)
 const formatDuration = (workout: any, category?: string) => {
 // duration_seconds가 있으면 사용, 없으면 duration_minutes 사용
 const durationSeconds = workout.durationSeconds;
 const durationMinutes = workout.durationMinutes;
 
 if (durationSeconds && durationSeconds > 0) {
 // duration_seconds로 표시
 const minutes = Math.floor(durationSeconds / 60);
 const remainingSeconds = durationSeconds % 60;
 
 // 수영은 소수점 두자리까지, 나머지는 정수로
 const formattedSeconds = category === '수영' 
 ? remainingSeconds.toFixed(2) 
 : Math.round(remainingSeconds).toString();
 
 if (minutes === 0) return `${formattedSeconds}초`;
 if (remainingSeconds === 0) return `${minutes}분`;
 return `${minutes}분 ${formattedSeconds}초`;
 } else if (durationMinutes && durationMinutes > 0) {
 // duration_minutes로 표시
 return `${durationMinutes}분`;
 }
 
 return '-';
 };

 // 강도 존을 표시하는 함수
 const getIntensityLabel = (intensity: number) => {
 if (!intensity) return null;
 return `Zone ${intensity}`;
 };

 // 날짜 포맷팅 함수
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
// console.error('저장 중 에러:', e);
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
 
 {/* PC 버전 헤더 - 타이틀과 네비게이션 */}
 <div className="hidden lg:flex flex-col px-8 pt-4 sm:px-4 sm:pt-4">
 {/* 챌린지 기간 표시 */}
 {challengeInfo && (
 <div className="text-body text-content-tertiary mb-2">
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
 <div className="text-content-tertiary text-headline font-bold">
 {challengeTitle || ''}
 </div>
 
 {/* 타이틀과 네비게이션 */}
 <div className="flex items-center justify-between">
 <div className="flex flex-col gap-2">
 <h1 className="sm:text-headline-lg font-bold lg:text-display font-bold font-bold text-content-primary">
 {fetchedUserName || userData.name}님의 W{currentWeekData.weekNumber || weekNumberParam} 운동 현황
 </h1>
 </div>
 
 {/* 네비게이션 버튼들 */}
 <div className="flex items-center gap-3">
 {/* 새로고침 버튼 */}
 <button
 onClick={async () => {
 setIsRefreshing(true);
 // 데이터 초기화
 setWeekWorkouts([]);
 setUpdatedDailyWorkouts([]);
 setUpdatedWorkoutTypes({});
 setCoachFeedback('');
 setFeedbackDate(null);
 try {
 // 모든 데이터 새로고침
 await refetchWorkoutData();
 
 // userData가 업데이트된 후 실행되도록 약간의 딜레이
 setTimeout(async () => {
 await fetchWeekWorkouts();
 // 피드백 데이터도 새로 가져오기는 useEffect에서 자동으로 처리됨
 }, 100);
 } finally {
 setTimeout(() => setIsRefreshing(false), 600);
 }
 }}
 disabled={isRefreshing}
 className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-content-secondary bg-surface border border-line rounded-lg hover:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
 aria-label="데이터 새로고침"
 >
 <IoRefresh 
 className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} 
 />
 {isRefreshing ? '새로고침 중...' : '새로고침'}
 </button>
 {/* 멤버 네비게이션 */}
 <button
 onClick={() => navigateToMember('prev')}
 className="p-2 bg-surface hover:bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-all duration-200 shadow-sm hover:shadow border border-line hover:border-blue-200"
 disabled={members.length === 0}
 >
 <ChevronLeft className="w-4 h-4 text-content-secondary" />
 </button>
 
 <div className="relative" ref={memberDropdownRef}>
 <button
 onClick={(e) => {
 e.stopPropagation();
 setShowMemberDropdown(!showMemberDropdown);
 setShowWeekDropdown(false);
 }}
 className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-all duration-200 shadow-sm hover:shadow border border-line hover:border-blue-200"
 >
 <span className="font-medium text-content-primary">
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
 <div className="absolute top-full right-0 mt-3 w-72 bg-surface rounded-xl shadow-xl border border-line-subtle max-h-96 overflow-hidden z-50">
 {/* 검색 입력창 */}
 <div className="sticky top-0 bg-surface border-b border-line-subtle">
 <div className="p-3">
 <input
 type="text"
 placeholder="🔍 이름으로 검색"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full px-4 py-2.5 bg-surface-raised border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-surface transition-all"
 onClick={(e) => e.stopPropagation()}
 />
 </div>
 <div className="px-4 py-2 bg-surface-raised">
 <span className="text-xs font-medium text-content-secondary">
 {searchQuery ? `${filteredMembers.length}명 검색됨` : `전체 ${members.length}명`}
 </span>
 </div>
 </div>
 {membersLoading ? (
 <div className="p-4 text-center text-content-tertiary">
 로딩 중...
 </div>
 ) : filteredMembers.length === 0 ? (
 <div className="p-4 text-center text-content-tertiary">
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
 className={`w-full px-4 py-3 text-left transition-all duration-150 border-b border-line-subtle ${
 member.service_user_id === userId
 ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 dark:text-blue-300 font-semibold'
 : 'hover:bg-surface-raised'
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
 className="p-2 bg-surface hover:bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-all duration-200 shadow-sm hover:shadow border border-line hover:border-blue-200"
 disabled={members.length === 0}
 >
 <ChevronRight className="w-4 h-4 text-content-secondary" />
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
 className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-all duration-200 shadow-sm hover:shadow border border-line hover:border-blue-200"
 >
 <span className="font-medium text-content-primary">W{currentWeekData.weekNumber || weekNumberParam}</span>
 <span className="text-xs text-content-disabled">{currentWeekData.label}</span>
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
 <div className="absolute top-full right-0 mt-3 w-56 bg-surface rounded-xl shadow-xl border border-line-subtle max-h-72 overflow-y-auto z-50">
 <div className="py-2">
 {userData?.weeklyWorkouts.map((week) => (
 <button
 key={week.recordId}
 onClick={(e) => {
 e.stopPropagation();
 handleWeekSelect(week.weekNumber, week.label);
 }}
 className={`w-full px-4 py-3 text-left transition-all duration-150 border-b border-line-subtle ${
 week.weekNumber === weekNumberParam
 ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700'
 : 'hover:bg-surface-raised'
 }`}
 >
 <div>
 <span className="font-semibold">W{week.weekNumber}</span>
 <span className="text-xs text-content-disabled ml-2">{week.label}</span>
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
 <div className="text-body text-content-tertiary mb-2">
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
 <div className="text-content-tertiary text-headline font-bold">
 {challengeTitle || ''}
 </div>
 
 {/* 타이틀 */}
 <div className="flex flex-col gap-2">
 <h1 className="sm:text-headline-lg font-bold lg:text-display font-bold font-bold text-content-primary">
 {fetchedUserName || userData.name}님의 W{currentWeekData.weekNumber || weekNumberParam} 운동 현황
 </h1>
 </div>
 </div>
 
 {/* 모바일 네비게이션 */}
 <div className="flex flex-col gap-4 lg:hidden px-8 pt-4 sm:px-4 sm:pt-4">
 {/* 새로고침 버튼 - 모바일 */}
 <div className="flex justify-center">
 <button
 onClick={async () => {
 setIsRefreshing(true);
 // 데이터 초기화
 setWeekWorkouts([]);
 setUpdatedDailyWorkouts([]);
 setUpdatedWorkoutTypes({});
 setCoachFeedback('');
 setFeedbackDate(null);
 try {
 // 모든 데이터 새로고침
 await refetchWorkoutData();
 
 // userData가 업데이트된 후 실행되도록 약간의 딜레이
 setTimeout(async () => {
 await fetchWeekWorkouts();
 // 피드백 데이터도 새로 가져오기는 useEffect에서 자동으로 처리됨
 }, 100);
 } finally {
 setTimeout(() => setIsRefreshing(false), 600);
 }
 }}
 disabled={isRefreshing}
 className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-content-secondary bg-surface border border-line rounded-lg hover:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
 aria-label="데이터 새로고침"
 >
 <IoRefresh 
 className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} 
 />
 {isRefreshing ? '새로고침 중...' : '새로고침'}
 </button>
 </div>
 {/* 멤버 네비게이션 */}
 <div className="flex items-center gap-3 w-full">
 <button
 onClick={() => navigateToMember('prev')}
 className="p-2.5 bg-surface hover:bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-all duration-200 shadow-sm hover:shadow border border-line hover:border-blue-200"
 disabled={members.length === 0}
 >
 <ChevronLeft className="w-4 h-4 text-content-secondary" />
 </button>
 
 <div className="relative flex-1" ref={memberDropdownRef}>
 <button
 onClick={() => {
 setShowMemberDropdown(!showMemberDropdown);
 setShowWeekDropdown(false);
 }}
 className="flex items-center justify-between px-5 py-3 bg-surface hover:bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-all duration-200 w-full shadow-sm hover:shadow border border-line hover:border-blue-200"
 >
 <div className="flex-1 text-center">
 <span className="font-semibold text-content-primary">
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
 <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 w-72 bg-surface rounded-xl shadow-xl border border-line-subtle max-h-96 overflow-hidden z-50">
 <div className="sticky top-0 bg-surface border-b border-line-subtle">
 <div className="p-3">
 <input
 type="text"
 placeholder="🔍 이름으로 검색"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full px-4 py-2.5 bg-surface-raised border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-surface transition-all"
 onClick={(e) => e.stopPropagation()}
 />
 </div>
 <div className="px-4 py-2 bg-surface-raised">
 <span className="text-xs font-medium text-content-secondary">
 {searchQuery ? `${filteredMembers.length}명 검색됨` : `전체 ${members.length}명`}
 </span>
 </div>
 </div>
 {membersLoading ? (
 <div className="p-4 text-center text-content-tertiary">로딩 중...</div>
 ) : filteredMembers.length === 0 ? (
 <div className="p-4 text-center text-content-tertiary">검색 결과가 없습니다</div>
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
 className={`w-full px-4 py-3 text-left transition-all duration-150 border-b border-line-subtle ${
 member.service_user_id === userId
 ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 dark:text-blue-300 font-semibold'
 : 'hover:bg-surface-raised'
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
 className="p-2.5 bg-surface hover:bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-all duration-200 shadow-sm hover:shadow border border-line hover:border-blue-200"
 disabled={members.length === 0}
 >
 <ChevronRight className="w-4 h-4 text-content-secondary" />
 </button>
 </div>
 
 {/* 구분선 */}
 <div className="h-px w-full bg-surface-sunken"></div>
 
 {/* 주차 선택 드롭다운 */}
 <div className="relative w-full flex justify-center" ref={weekDropdownRef}>
 <button
 onClick={() => {
 setShowWeekDropdown(!showWeekDropdown);
 setShowMemberDropdown(false);
 setSearchQuery('');
 }}
 className="flex items-center justify-between px-5 py-3 bg-surface hover:bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-all duration-200 shadow-sm hover:shadow border border-line hover:border-blue-200 w-full"
 >
 <div className="flex-1 text-center">
 <div className="flex items-center justify-center gap-2">
 <span className="font-semibold text-content-primary">W{currentWeekData.weekNumber || weekNumberParam}</span>
 <span className="text-xs text-content-disabled">{currentWeekData.label}</span>
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
 <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 w-56 bg-surface rounded-xl shadow-xl border border-line-subtle max-h-72 overflow-y-auto z-50">
 <div className="py-2">
 {userData?.weeklyWorkouts.map((week) => (
 <button
 key={week.recordId}
 onClick={(e) => {
 e.stopPropagation();
 handleWeekSelect(week.weekNumber, week.label);
 }}
 className={`w-full px-4 py-3 text-left transition-all duration-150 border-b border-line-subtle ${
 week.weekNumber === weekNumberParam
 ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700'
 : 'hover:bg-surface-raised'
 }`}
 >
 <span className="font-semibold">W{week.weekNumber}</span>
 <span className="text-xs text-content-disabled ml-2">{week.label}</span>
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

 <div className="bg-surface rounded-lg p-6 shadow-sm">
 <div className="font-bold mb-4">
 W{currentWeekData.weekNumber || weekNumberParam} <span className="text-content-tertiary font-normal">{currentWeekData.label}</span>
 </div>
 {/* PC 버전과 모바일 버전 분리 - 3컬럼 레이아웃 */}
 <div className="sm:flex sm:flex-col sm:gap-6 lg:grid lg:grid-cols-3 lg:gap-6">
 
 {/* 1컬럼: 도넛 그래프 + 근력운동 + 요일별 그래프 */}
 <div className="sm:w-full lg:col-span-1 flex flex-col lg:px-4">
 {/* 도넛 그래프 */}
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

 {/* 근력 운동 */}
 <div className="mb-4 bg-surface-raised px-6 py-6 rounded-lg">
 <div className="flex justify-between items-center">
 <div className="text-sm text-content-tertiary">근력 운동</div>
 <div className="text-blue-600 dark:text-blue-400 flex items-baseline gap-1">
 <span className="text-6xl font-bold leading-none">{currentWeekData.totalSessions || 0}</span>
 <span className="text-base font-bold">/2회</span>
 </div>
 </div>
 </div>

 {/* 요일별 그래프 */}
 <div className="flex-1 flex items-end">
 {isLoadingWeekData ? (
 <BarChartSkeleton />
 ) : (
 generateBarChart(
 updatedDailyWorkouts.length > 0 ? updatedDailyWorkouts : currentWeekData.dailyWorkouts,
 currentWeekData.totalSessions
 )
 )}
 </div>
 </div>

 {/* 2컬럼: 운동 기록 */}
 <div className="sm:w-full lg:col-span-1 flex flex-col">
 <div className="text-xs font-semibold text-content-secondary mb-2 flex justify-between items-center">
 <span>운동 기록</span>
 {weekWorkouts.length > 0 && (
 <span className="text-content-disabled text-[10px]">총 {weekWorkouts.length}개</span>
 )}
 </div>
 <div className="flex-1 overflow-y-auto max-h-[450px] workout-scroll">
 {isLoadingWeekData ? (
 <WorkoutListSkeleton />
 ) : weekWorkouts.length > 0 ? (
 <div className="space-y-2 pr-2">
 {weekWorkouts.map((workout, index) => {
 const workoutId = workout.id || `workout-${index}`;
 const isExpanded = expandedWorkouts.has(workoutId);
 const intensityLabel = getIntensityLabel(workout.intensity);

 // 운동 타입에 따른 색상 결정
 const isStrength = workout.type === 'STRENGTH';
 const borderColor = isStrength ? 'border-orange-400' : 'border-[#26CBFF]';
 const bgColor = isStrength ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-blue-50 dark:bg-blue-900/20';
 const hoverBgColor = isStrength ? 'hover:bg-orange-100 dark:hover:bg-orange-900/30' : 'hover:bg-blue-100 dark:hover:bg-blue-900/30';

 return (
 <div
 key={workoutId}
 className="border border-line rounded-lg overflow-hidden"
 >
 {/* 메인 운동 정보 */}
 <div
 className={`border-l-4 ${borderColor} pl-3 pr-3 py-2 ${bgColor} cursor-pointer ${hoverBgColor} transition-colors relative workout-card-hover`}
 onClick={() => toggleWorkoutDetails(workoutId)}
 >
 <div className="flex justify-between items-start">
 <div className="flex-1">
 {/* Title을 크게 표시 */}
 <div className="text-sm font-bold text-content-primary">
 {workout.title}
 </div>
 {/* Category를 작게 표시 */}
 <div className="text-[10px] text-content-tertiary mt-0.5">
 {workout.category}
 </div>
 <div className="text-[10px] text-content-secondary mt-1">
 {(() => {
 // DB는 UTC+9로 저장되어 있으므로 -9시간 조정하여 실제 운동 시간 표시
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
 <div className="text-content-disabled">
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
 
 {/* 노트 태그 - 우측 하단 */}
 {workout.note && (
 <div className="absolute bottom-2 right-8">
 <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-blue-100 text-blue-700 dark:text-blue-300 dark:bg-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
 노트
 </span>
 </div>
 )}
 
 {/* Hover 툴팁 */}
 <div className="absolute left-full top-0 ml-2 w-64 bg-surface border border-line rounded-lg shadow-lg p-3 opacity-0 invisible hover-tooltip transition-all duration-200 z-50">
 <div className="space-y-2 text-[10px]">
 {/* 운동 시간 */}
 <div className="flex justify-between">
 <span className="text-content-tertiary">운동시간:</span>
 <span className="font-medium text-content-primary">
 {formatDuration(workout, workout.category)}
 </span>
 </div>

 {/* 강도 존 */}
 <div className="flex justify-between">
 <span className="text-content-tertiary">강도:</span>
 <span className="font-medium text-orange-600 dark:text-orange-400">
 {workout.intensity ? `Zone ${workout.intensity}` : '-'}
 </span>
 </div>

 {/* 평균 심박수 */}
 <div className="flex justify-between">
 <span className="text-content-tertiary">평균심박수:</span>
 <span className="font-medium text-content-primary">
 {workout.avgHeartRate ? `${workout.avgHeartRate} bpm` : '-'}
 </span>
 </div>

 {/* 최대 심박수 */}
 <div className="flex justify-between">
 <span className="text-content-tertiary">최대심박수:</span>
 <span className="font-medium text-content-primary">
 {workout.maxHeartRate ? `${workout.maxHeartRate} bpm` : '-'}
 </span>
 </div>

 {/* 운동 노트 */}
 {workout.note && (
 <div className="pt-2 border-t border-line">
 <div className="text-content-tertiary font-medium mb-1">노트:</div>
 <div className="text-content-secondary leading-relaxed whitespace-pre-wrap max-h-16 overflow-y-auto">
 {workout.note}
 </div>
 </div>
 )}
 </div>
 
 {/* 툴팁 화살표 */}
 <div className="absolute left-0 top-4 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-white dark:border-r-gray-800 -translate-x-full"></div>
 </div>
 </div>

 {/* 확장된 상세 정보 */}
 {isExpanded && (
 <div className="px-4 py-3 bg-surface border-t border-line">
 <div className="grid grid-cols-1 gap-2 text-[11px]">
 {/* 운동 시간 */}
 <div className="flex justify-between">
 <span className="text-content-tertiary">운동시간:</span>
 <span className="font-medium text-content-primary">
 {formatDuration(workout, workout.category)}
 </span>
 </div>

 {/* 강도 존 */}
 <div className="flex justify-between">
 <span className="text-content-tertiary">강도:</span>
 <span className="font-medium text-orange-600 dark:text-orange-400">
 {workout.intensity ? `Zone ${workout.intensity}` : '-'}
 </span>
 </div>

 {/* 평균 심박수 */}
 <div className="flex justify-between">
 <span className="text-content-tertiary">평균심박수:</span>
 <span className="font-medium text-content-primary">
 {workout.avgHeartRate ? `${workout.avgHeartRate} bpm` : '-'}
 </span>
 </div>

 {/* 최대 심박수 */}
 <div className="flex justify-between">
 <span className="text-content-tertiary">최대심박수:</span>
 <span className="font-medium text-content-primary">
 {workout.maxHeartRate ? `${workout.maxHeartRate} bpm` : '-'}
 </span>
 </div>
 </div>

 {/* 운동 노트 */}
 {workout.note && (
 <div className="mt-3 pt-3 border-t border-line">
 <div className="text-[11px]">
 <span className="text-content-tertiary font-medium">노트:</span>
 <p className="mt-1 text-content-secondary leading-relaxed whitespace-pre-wrap">
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
 <div className="text-xs text-content-disabled text-center py-4">
 이번 주 운동 기록이 없습니다.
 </div>
 )}
 </div>
 </div>

 {/* 3컬럼: AI 분석 + 코치 피드백 */}
 <div className="sm:w-full lg:col-span-1 flex flex-col sm:min-h-[600px] lg:min-h-0">
 <div className="grid grid-cols-1 gap-4 flex-1">
 {aiFeedback && (
 <div className="flex flex-col">
 <div className="text-xs font-semibold text-content-secondary mb-2">
 AI 분석 결과
 </div>
 <div>
 <TextBox
 title=""
 value={aiFeedback}
 placeholder=""
 readOnly
 copyIcon
 />
 </div>
 </div>
 )}
 <div className="flex flex-col flex-1">
 <div className="flex justify-between items-center mb-2">
 <div className="text-xs font-semibold text-content-secondary">
 코치 피드백
 </div>
 {feedbackDate && (
 <div className="text-[10px] text-content-disabled">
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
 Btn1className="bg-green-500 text-white"
 svg1="/svg/send.svg"
 onChange={(e) => setCoachFeedback(e.target.value)}
 onSave={async (feedback) => {
 await handleFeedbackSave(feedback);
 }}
 isFeedbackMode={true}
 copyIcon
 className="h-full"
 disabled={saving}
 />
 </div>
 </div>
 </div>
 <button
 className="pt-[6rem] text-content-disabled font-bold hover:font-extrabold cursor-pointer sm:px-[2rem] sm:block lg:hidden md:hidden"
 onClick={handleBack}
 >
 ← 목록으로
 </button>
 </div>
 </div>
 </div>
 </div>
 
 {/* 목록으로 버튼 - 컨테이너 바깥 */}
 <div className="flex justify-start px-4 pt-4">
 <button
 className="text-content-disabled font-bold hover:font-extrabold cursor-pointer sm:hidden lg:block md:block"
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