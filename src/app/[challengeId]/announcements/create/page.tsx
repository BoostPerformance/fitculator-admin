'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, X, Plus, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// Tiptap 에디터를 클라이언트 사이드에서만 로드
const AnnouncementEditor = dynamic(
  () => import('@/components/AnnouncementEditor'),
  { ssr: false }
);

interface WorkoutSession {
  time: string;
  type: string;
  warmup: string;
  main_session: string;
}

interface WorkoutDay {
  korean_name: string;
  english_name: string;
  sessions: WorkoutSession[];
}

interface WorkoutScheduleData {
  days: {
    [key: string]: WorkoutDay;
  };
  schedule_type: 'weekly';
  notes?: {
    safety?: string;
    general?: string;
    abbreviations?: { [key: string]: string };
  };
}

interface ChallengeGroup {
  id: string;
  name: string;
  description?: string;
  color_code?: string;
  sort_order: number;
}

// 약어 입력 컴포넌트
function AbbreviationInput({ onAdd }: { onAdd: (key: string, value: string) => void }) {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');

  const handleAdd = () => {
    if (key.trim() && value.trim()) {
      onAdd(key.trim(), value.trim());
      setKey('');
      setValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <input
        type="text"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        onKeyPress={handleKeyPress}
        className="px-2 py-1.5 text-sm border border-slate-200 dark:border-gray-600 rounded-lg w-20 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white bg-white dark:bg-gray-800 text-slate-900 dark:text-white"
        placeholder="약어"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyPress={handleKeyPress}
        className="flex-1 px-2 py-1.5 text-sm border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white bg-white dark:bg-gray-800 text-slate-900 dark:text-white"
        placeholder="설명"
      />
      <button
        type="button"
        onClick={handleAdd}
        className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 transition-colors"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

export default function CreateAnnouncementPage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.challengeId as string;

  const [loading, setLoading] = useState(false);
  const [challengeGroups, setChallengeGroups] = useState<ChallengeGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]); // 빈 배열 = 전체 공지
  const [formData, setFormData] = useState({
    title: '',
    type: 'general' as 'general' | 'workout_schedule',
    content: { type: 'doc', content: [] } as object,
    status: 'published' as 'published',
    priority: 1,
    show_on_main: false,
    start_date: '',
    end_date: '',
    target_audience: 'all' as 'all' | 'beginner' | 'intermediate' | 'advanced'
  });

  // 챌린지 그룹 목록 가져오기
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch(`/api/challenge-groups?challenge_id=${challengeId}`);
        if (response.ok) {
          const result = await response.json();
          // API가 { data: [...] } 형태로 반환
          const groups = result.data || result;
          if (Array.isArray(groups)) {
            setChallengeGroups(groups.sort((a: ChallengeGroup, b: ChallengeGroup) => a.sort_order - b.sort_order));
          }
        }
      } catch (error) {
        console.error('Failed to fetch challenge groups:', error);
      }
    };
    fetchGroups();
  }, [challengeId]);

  // 그룹 선택/해제 토글
  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroupIds(prev => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };

  // 전체 선택 (모든 그룹 선택 해제 = 전체 공지)
  const selectAllGroups = () => {
    setSelectedGroupIds([]);
  };

  // 운동 일정 데이터 초기화
  const initializeWorkoutSchedule = (): WorkoutScheduleData => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const koreanNames = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];
    const englishNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    const schedule: WorkoutScheduleData = {
      days: {},
      schedule_type: 'weekly',
      notes: {
        safety: '',
        general: '',
        abbreviations: {}
      }
    };

    days.forEach((day, index) => {
      schedule.days[day] = {
        korean_name: koreanNames[index],
        english_name: englishNames[index],
        sessions: []
      };
    });

    return schedule;
  };

  const [workoutSchedule, setWorkoutSchedule] = useState<WorkoutScheduleData>(initializeWorkoutSchedule());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Tiptap content가 비어있는지 확인하는 함수
  const isTiptapContentEmpty = (content: object): boolean => {
    const doc = content as { type?: string; content?: Array<{ content?: unknown[] }> };
    if (doc.type !== 'doc') return true;
    if (!doc.content || doc.content.length === 0) return true;
    // 빈 paragraph만 있는 경우도 비어있는 것으로 처리
    return doc.content.every(node => !node.content || node.content.length === 0);
  };

  // 변경사항 감지
  useEffect(() => {
    const hasChanges = !!(
      formData.title ||
      !isTiptapContentEmpty(formData.content) ||
      formData.priority > 0 ||
      formData.start_date ||
      formData.end_date ||
      formData.target_audience !== 'all' ||
      (formData.type === 'workout_schedule' && Object.values(workoutSchedule.days).some(day => day.sessions.length > 0))
    );
    setHasUnsavedChanges(hasChanges);
  }, [formData, workoutSchedule]);

  // 페이지 떠날 때 경고
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // 세션 추가 (AM/PM 각각 최대 1개씩)
  const addSession = (day: string) => {
    const currentSessions = workoutSchedule.days[day].sessions;
    const hasAM = currentSessions.some(session => session.time === 'AM');
    const hasPM = currentSessions.some(session => session.time === 'PM');
    
    let defaultTime = 'AM';
    if (hasAM && !hasPM) {
      defaultTime = 'PM';
    } else if (hasAM && hasPM) {
      alert('AM과 PM 세션이 모두 있습니다. 더 이상 추가할 수 없습니다.');
      return;
    }

    const newSession: WorkoutSession = {
      time: defaultTime,
      type: '',
      warmup: '',
      main_session: ''
    };

    setWorkoutSchedule(prev => ({
      ...prev,
      days: {
        ...prev.days,
        [day]: {
          ...prev.days[day],
          sessions: [...prev.days[day].sessions, newSession]
        }
      }
    }));
  };

  // 세션 삭제
  const removeSession = (day: string, sessionIndex: number) => {
    setWorkoutSchedule(prev => ({
      ...prev,
      days: {
        ...prev.days,
        [day]: {
          ...prev.days[day],
          sessions: prev.days[day].sessions.filter((_, index) => index !== sessionIndex)
        }
      }
    }));
  };

  // 세션 업데이트
  const updateSession = (day: string, sessionIndex: number, field: keyof WorkoutSession, value: string) => {
    // 시간 변경 시 중복 체크
    if (field === 'time' && (value === 'AM' || value === 'PM')) {
      const currentSessions = workoutSchedule.days[day].sessions;
      const existingSession = currentSessions.find((session, index) => 
        index !== sessionIndex && session.time === value
      );
      
      if (existingSession) {
        alert(`${value} 시간대는 이미 다른 세션에서 사용 중입니다.`);
        return;
      }
    }

    setWorkoutSchedule(prev => ({
      ...prev,
      days: {
        ...prev.days,
        [day]: {
          ...prev.days[day],
          sessions: prev.days[day].sessions.map((session, index) => 
            index === sessionIndex ? { ...session, [field]: value } : session
          )
        }
      }
    }));
  };

  // 노트 업데이트
  const updateNotes = (field: 'safety' | 'general', value: string) => {
    setWorkoutSchedule(prev => ({
      ...prev,
      notes: {
        ...prev.notes,
        [field]: value
      }
    }));
  };

  // 약어 추가
  const addAbbreviation = (key: string, value: string) => {
    if (!key.trim() || !value.trim()) return;
    
    setWorkoutSchedule(prev => ({
      ...prev,
      notes: {
        ...prev.notes,
        abbreviations: {
          ...prev.notes?.abbreviations,
          [key]: value
        }
      }
    }));
  };

  // 약어 삭제
  const removeAbbreviation = (key: string) => {
    setWorkoutSchedule(prev => {
      const newAbbreviations = { ...prev.notes?.abbreviations };
      delete newAbbreviations[key];
      
      return {
        ...prev,
        notes: {
          ...prev.notes,
          abbreviations: newAbbreviations
        }
      };
    });
  };

  const handleBack = () => {
    if (hasUnsavedChanges && !confirm('저장하지 않은 내용이 있습니다. 정말로 나가시겠습니까?')) {
      return;
    }
    router.back();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 필수 필드 검증
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    
    if (!formData.start_date) {
      alert('시작일을 선택해주세요.');
      return;
    }
    
    if (!formData.end_date) {
      alert('종료일을 선택해주세요.');
      return;
    }
    
    if (formData.type === 'general' && isTiptapContentEmpty(formData.content)) {
      alert('공지사항 내용을 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      let processedContent: string | object = formData.content;

      // 운동 일정의 경우 구조화된 데이터 사용
      if (formData.type === 'workout_schedule') {
        // 모든 요일이 포함되도록 처리 (빈 요일은 기본값으로 채움)
        const processedSchedule: any = {
          days: Object.fromEntries(
            Object.entries(workoutSchedule.days).map(([day, data]) => {
              // 세션이 없는 요일에 기본 세션 추가 (실제로는 모든 요일에 세션이 있어야 함)
              if (data.sessions.length === 0) {
                return [
                  day,
                  {
                    ...data,
                    sessions: [{
                      time: "AM",
                      type: "Rest",
                      warmup: [],
                      main_session: ""
                    }]
                  }
                ];
              }
              
              // 세션이 있는 경우 warmup을 배열로 변환
              return [
                day,
                {
                  ...data,
                  sessions: data.sessions.map(session => ({
                    time: session.time || "AM",
                    type: session.type || "",
                    warmup: session.warmup 
                      ? session.warmup.split('\n').filter(item => item.trim())
                      : [],
                    main_session: session.main_session || ""
                  }))
                }
              ];
            })
          ),
          schedule_type: 'weekly'
        };
        
        // notes가 있을 때만 추가 (옵셔널) - 빈 문자열은 제외
        if (workoutSchedule.notes && (
          (workoutSchedule.notes.safety && workoutSchedule.notes.safety.trim()) || 
          (workoutSchedule.notes.general && workoutSchedule.notes.general.trim()) || 
          Object.keys(workoutSchedule.notes.abbreviations || {}).length > 0
        )) {
          processedSchedule.notes = workoutSchedule.notes;
        }
        processedContent = processedSchedule;
      }

      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          content: processedContent,
          challenge_id: challengeId,
          target_group_ids: selectedGroupIds.length > 0 ? selectedGroupIds : null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create announcement');
      }

      router.push(`/${challengeId}/announcements`);
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('공지사항 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            돌아가기
          </button>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">새 공지사항</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">공지사항을 작성하고 발행합니다</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <section>
          <h2 className="text-sm font-medium text-slate-900 dark:text-white mb-4">기본 정보</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">제목</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent transition-shadow bg-white dark:bg-gray-800 text-slate-900 dark:text-white"
                placeholder="공지사항 제목"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">유형</label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent bg-white dark:bg-gray-800 text-slate-900 dark:text-white"
                >
                  <option value="general">일반 공지</option>
                  <option value="workout_schedule">운동 일정</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">우선순위</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent bg-white dark:bg-gray-800 text-slate-900 dark:text-white"
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">숫자가 높을수록 상단에 표시됩니다</p>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.show_on_main}
                  onChange={(e) => setFormData({ ...formData, show_on_main: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white focus:ring-slate-900 dark:focus:ring-white"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">메인에 표시</span>
              </label>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 ml-6">체크하면 앱 메인 화면에 공지사항이 표시됩니다</p>
            </div>

            {challengeGroups.length > 0 && (
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">대상 그룹</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={selectAllGroups}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      selectedGroupIds.length === 0
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                        : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-gray-600 hover:border-slate-300 dark:hover:border-gray-500'
                    }`}
                  >
                    전체
                  </button>
                  {challengeGroups.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => {
                        if (selectedGroupIds.length === 0) {
                          setSelectedGroupIds([group.id]);
                        } else {
                          toggleGroupSelection(group.id);
                        }
                      }}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                        selectedGroupIds.includes(group.id)
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                          : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-gray-600 hover:border-slate-300 dark:hover:border-gray-500'
                      }`}
                    >
                      {group.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Date Range */}
        <section>
          <h2 className="text-sm font-medium text-slate-900 dark:text-white mb-4">게시 기간</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">시작일</label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent bg-white dark:bg-gray-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">종료일</label>
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent bg-white dark:bg-gray-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </section>

        {/* Content */}
        <section>
          <h2 className="text-sm font-medium text-slate-900 dark:text-white mb-4">내용</h2>

          {formData.type === 'general' && (
            <div className="border border-slate-200 dark:border-gray-600 rounded-lg overflow-hidden">
              <AnnouncementEditor
                content={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
              />
            </div>
          )}

          {formData.type === 'workout_schedule' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                세션이 없는 요일은 자동으로 휴식일로 처리됩니다
              </p>

              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                const dayData = workoutSchedule.days[day];
                return (
                  <div key={day} className="border border-slate-200 dark:border-gray-700 rounded-lg">
                    <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 dark:border-gray-700">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {dayData.korean_name}
                        <span className="text-slate-400 dark:text-slate-500 font-normal ml-1.5">{dayData.english_name}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => addSession(day)}
                        className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <Plus size={14} />
                        세션 추가
                      </button>
                    </div>

                    <div className="p-4">
                      {dayData.sessions.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-slate-500">세션 없음</p>
                      ) : (
                        <div className="space-y-3">
                          {dayData.sessions.map((session, sessionIndex) => (
                            <div key={sessionIndex} className="bg-slate-50 dark:bg-gray-800 rounded-lg p-3 space-y-3">
                              <div className="flex justify-between items-start gap-3">
                                <div className="grid grid-cols-2 gap-3 flex-1">
                                  <div>
                                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">시간</label>
                                    <select
                                      value={session.time}
                                      onChange={(e) => updateSession(day, sessionIndex, 'time', e.target.value)}
                                      className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                                    >
                                      <option value="AM">AM</option>
                                      <option value="PM">PM</option>
                                      <option value="-">미정</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">운동 타입</label>
                                    <input
                                      type="text"
                                      value={session.type}
                                      onChange={(e) => updateSession(day, sessionIndex, 'type', e.target.value)}
                                      className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                                      placeholder="Hyrox Flow"
                                    />
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeSession(day, sessionIndex)}
                                  className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>

                              <div>
                                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">워밍업</label>
                                <textarea
                                  value={session.warmup}
                                  onChange={(e) => updateSession(day, sessionIndex, 'warmup', e.target.value)}
                                  className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white resize-none"
                                  rows={2}
                                  placeholder="줄바꿈으로 구분"
                                />
                              </div>

                              <div>
                                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">메인 세션</label>
                                <textarea
                                  value={session.main_session}
                                  onChange={(e) => updateSession(day, sessionIndex, 'main_session', e.target.value)}
                                  className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white resize-none font-mono"
                                  rows={4}
                                  placeholder="운동 내용"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Notes 섹션 */}
              <div className="pt-4 border-t border-slate-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-4">참고사항</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">안전 주의사항</label>
                    <textarea
                      value={workoutSchedule.notes?.safety || ''}
                      onChange={(e) => updateNotes('safety', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white resize-none"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">일반 안내</label>
                    <textarea
                      value={workoutSchedule.notes?.general || ''}
                      onChange={(e) => updateNotes('general', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white resize-none"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">약어 설명</label>
                    <div className="space-y-2">
                      {Object.entries(workoutSchedule.notes?.abbreviations || {}).map(([key, value]) => (
                        <div key={key} className="flex gap-2 items-center">
                          <span className="px-2 py-1 text-xs bg-slate-100 dark:bg-gray-700 rounded font-medium text-slate-700 dark:text-slate-300 min-w-[60px]">{key}</span>
                          <span className="text-sm text-slate-600 dark:text-slate-400 flex-1">{value}</span>
                          <button
                            type="button"
                            onClick={() => removeAbbreviation(key)}
                            className="text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <AbbreviationInput onAdd={addAbbreviation} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            {loading ? '저장 중...' : '발행하기'}
          </button>
        </div>
        </form>
      </div>
    </div>
  );
}