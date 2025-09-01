'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, X, Plus, Trash2 } from 'lucide-react';

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
    <div className="flex gap-2">
      <input
        type="text"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        onKeyPress={handleKeyPress}
        className="px-2 py-1 text-sm border border-gray-300 rounded w-24"
        placeholder="약어"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyPress={handleKeyPress}
        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
        placeholder="설명"
      />
      <button
        type="button"
        onClick={handleAdd}
        className="text-blue-600 hover:text-blue-700 p-1"
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
  const [formData, setFormData] = useState({
    title: '',
    type: 'general' as 'general' | 'workout_schedule',
    content: '',
    status: 'draft' as 'draft' | 'published',
    priority: 0,
    start_date: '',
    end_date: '',
    target_audience: 'all' as 'all' | 'beginner' | 'intermediate' | 'advanced'
  });

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

  // 변경사항 감지
  useEffect(() => {
    const hasChanges = !!(
      formData.title ||
      formData.content ||
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
    
    if (formData.type === 'general' && !formData.content.trim()) {
      alert('공지사항 내용을 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      let processedContent = formData.content;

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
          challenge_id: challengeId
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
    <div className="p-6 flex justify-center">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBack}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">새 공지사항 작성</h1>
        </div>

        <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">기본 정보</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목 *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="공지사항 제목을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                유형 *
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="general">일반 공지</option>
                <option value="workout_schedule">운동 일정</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상태
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="draft">초안</option>
                <option value="published">발행</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                우선순위
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                대상 그룹
              </label>
              <select
                value={formData.target_audience}
                onChange={(e) => setFormData({ ...formData, target_audience: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">전체</option>
              </select>
            </div>
          </div>
        </div>

        {/* Date Range */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">게시 기간 *</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작일 *
              </label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                종료일 *
              </label>
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">내용</h2>
          
          {formData.type === 'general' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                공지사항 내용 *
              </label>
              <textarea
                required
                rows={10}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="공지사항 내용을 입력하세요. 줄바꿈은 자동으로 처리됩니다."
              />
            </div>
          )}

          {formData.type === 'workout_schedule' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">주간 운동 일정</h3>
                <p className="text-sm text-gray-500 mt-1">
                  💡 세션이 없는 요일은 자동으로 휴식일로 처리됩니다. 필요한 요일만 세션을 추가하세요.
                </p>
              </div>
              
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day, dayIndex) => {
                const dayData = workoutSchedule.days[day];
                return (
                  <div key={day} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-gray-900">
                        {dayData.korean_name} ({dayData.english_name})
                      </h4>
                      <button
                        type="button"
                        onClick={() => addSession(day)}
                        className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
                      >
                        <Plus size={16} />
                        세션 추가
                      </button>
                    </div>

                    {dayData.sessions.length === 0 ? (
                      <p className="text-gray-400 text-sm">세션이 없습니다. 세션을 추가해주세요.</p>
                    ) : (
                      <div className="space-y-4">
                        {dayData.sessions.map((session, sessionIndex) => (
                          <div key={sessionIndex} className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="grid grid-cols-2 gap-4 flex-1">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    시간
                                  </label>
                                  <select
                                    value={session.time}
                                    onChange={(e) => updateSession(day, sessionIndex, 'time', e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                  >
                                    <option value="AM">AM</option>
                                    <option value="PM">PM</option>
                                    <option value="-">시간 미정</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    운동 타입
                                  </label>
                                  <input
                                    type="text"
                                    value={session.type}
                                    onChange={(e) => updateSession(day, sessionIndex, 'type', e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                    placeholder="예: Hyrox Flow"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeSession(day, sessionIndex)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                워밍업
                              </label>
                              <textarea
                                value={session.warmup}
                                onChange={(e) => updateSession(day, sessionIndex, 'warmup', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                rows={3}
                                placeholder="3:00 foam roller massage&#10;2x 12 Band pull-aparts&#10;5 thoracic spine rotation"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                메인 세션
                              </label>
                              <textarea
                                value={session.main_session}
                                onChange={(e) => updateSession(day, sessionIndex, 'main_session', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                rows={6}
                                placeholder="A) Strength - 8min&#10;3×5reps Deadlift @68–75% 1RM&#10;&#10;B) HYROX FLOW&#10;600m Ski&#10;30 DB One arm snatch"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Notes 섹션 */}
              <div className="border-t border-gray-300 pt-6">
                <h4 className="font-medium text-gray-900 mb-4">참고사항 (선택사항)</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      안전 주의사항
                    </label>
                    <input
                      type="text"
                      value={workoutSchedule.notes?.safety || ''}
                      onChange={(e) => updateNotes('safety', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="⚠️ 운동 전 충분한 워밍업 필수. 무리하지 마세요."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      일반 안내사항
                    </label>
                    <input
                      type="text"
                      value={workoutSchedule.notes?.general || ''}
                      onChange={(e) => updateNotes('general', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="💡 운동 후 쿨다운과 수분 섭취를 잊지 마세요."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      약어 설명
                    </label>
                    <div className="space-y-2">
                      {Object.entries(workoutSchedule.notes?.abbreviations || {}).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <input
                            type="text"
                            value={key}
                            readOnly
                            className="px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50 w-24"
                          />
                          <input
                            type="text"
                            value={value}
                            readOnly
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50"
                          />
                          <button
                            type="button"
                            onClick={() => removeAbbreviation(key)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 size={16} />
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
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <X size={16} />
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
        </form>
      </div>
    </div>
  );
}