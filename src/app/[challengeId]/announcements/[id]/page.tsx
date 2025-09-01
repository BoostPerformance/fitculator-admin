'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, ChevronDown, ChevronUp, Calendar, Users, Clock, Flag } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  type: 'general' | 'workout_schedule';
  content: any;
  status: 'draft' | 'published' | 'archived';
  priority: number;
  start_date?: string;
  end_date?: string;
  target_audience: 'all' | 'beginner' | 'intermediate' | 'advanced';
  created_at: string;
  updated_at: string;
  published_at?: string;
}

interface WorkoutSession {
  time: string;
  type: string;
  warmup: string[];
  main_session: string;
}

interface WorkoutDay {
  korean_name: string;
  english_name: string;
  sessions: WorkoutSession[];
}

const typeLabels = {
  general: '일반',
  workout_schedule: '운동 일정'
};

const statusLabels = {
  draft: '초안',
  published: '발행됨',
  archived: '보관됨'
};

const workoutTypeColors: { [key: string]: string } = {
  'Running Performance': 'bg-blue-100 text-blue-800',
  'Hyrox Flow': 'bg-green-100 text-green-800',
  'Strength Endurance': 'bg-orange-100 text-orange-800',
  'Team of 2': 'bg-purple-100 text-purple-800',
  'RoxFlow- Test': 'bg-red-100 text-red-800',
  'default': 'bg-gray-100 text-gray-800'
};

export default function AnnouncementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.challengeId as string;
  const announcementId = params.id as string;

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchAnnouncement();
  }, [announcementId]);

  const fetchAnnouncement = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/announcements/${announcementId}`);
      if (!response.ok) throw new Error('Failed to fetch announcement');
      
      const data = await response.json();
      setAnnouncement(data);
    } catch (error) {
      console.error('Error fetching announcement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말로 이 공지사항을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/announcements/${announcementId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete announcement');
      
      router.push(`/${challengeId}/announcements`);
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const toggleDayExpansion = (day: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderWorkoutSchedule = (content: any) => {
    if (!content.days) return null;

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    return (
      <div className="space-y-4">
        {days.map(dayKey => {
          const day: WorkoutDay = content.days[dayKey];
          if (!day) return null;

          const isExpanded = expandedDays[dayKey];
          
          return (
            <div key={dayKey} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleDayExpansion(dayKey)}
                className="w-full px-4 py-3 flex justify-between items-center hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{day.korean_name}</span>
                  <span className="text-gray-500 text-sm">({day.english_name})</span>
                  {day.sessions && day.sessions.length > 0 && day.sessions[0].type && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      workoutTypeColors[day.sessions[0].type] || workoutTypeColors.default
                    }`}>
                      {day.sessions[0].type}
                    </span>
                  )}
                </div>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {isExpanded && day.sessions && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  {day.sessions.map((session, sessionIndex) => (
                    <div key={sessionIndex} className="space-y-3">
                      {session.time && (
                        <div className="text-sm text-gray-600">
                          <strong>시간:</strong> {session.time}
                        </div>
                      )}

                      {session.warmup && session.warmup.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">워밍업</h4>
                          <div className="space-y-1 text-sm text-gray-600 ml-4">
                            {session.warmup.map((item, i) => (
                              <div key={i}>{item}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {session.main_session && (
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">메인 세션</h4>
                          <div className="bg-white rounded p-3 border">
                            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                              {session.main_session}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {content.notes && (
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3">참고사항</h4>
            {content.notes.safety && (
              <p className="text-sm text-blue-800 mb-2">{content.notes.safety}</p>
            )}
            {content.notes.general && (
              <p className="text-sm text-blue-800 mb-2">{content.notes.general}</p>
            )}
            {content.notes.abbreviations && (
              <div className="mt-3">
                <p className="text-sm font-medium text-blue-900 mb-1">약어 설명:</p>
                {Object.entries(content.notes.abbreviations).map(([abbr, meaning]) => (
                  <p key={abbr} className="text-sm text-blue-800">
                    <strong>{abbr}:</strong> {meaning as string}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">공지사항을 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                {typeLabels[announcement.type]}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                announcement.status === 'published' ? 'bg-green-100 text-green-800' :
                announcement.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {statusLabels[announcement.status]}
              </span>
              {announcement.priority > 0 && (
                <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                  우선순위 {announcement.priority}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{announcement.title}</h1>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/${challengeId}/announcements/edit/${announcement.id}`)}
            className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
          >
            <Edit size={16} />
            수정
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <Trash2 size={16} />
            삭제
          </button>
        </div>
      </div>

      {/* Meta Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">대상:</span>
            <span className="ml-2 font-medium">
              {announcement.target_audience === 'all' ? '전체' : 
               announcement.target_audience === 'beginner' ? '초급' :
               announcement.target_audience === 'intermediate' ? '중급' : '고급'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">작성일:</span>
            <span className="ml-2 font-medium">{formatDate(announcement.created_at)}</span>
          </div>
          {announcement.published_at && (
            <div>
              <span className="text-gray-500">발행일:</span>
              <span className="ml-2 font-medium">{formatDate(announcement.published_at)}</span>
            </div>
          )}
          {announcement.start_date && announcement.end_date && (
            <div>
              <span className="text-gray-500">게시기간:</span>
              <span className="ml-2 font-medium">
                {new Date(announcement.start_date).toLocaleDateString()} ~ {new Date(announcement.end_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {announcement.type === 'general' && announcement.content?.text && (
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
              {announcement.content.text}
            </pre>
          </div>
        )}

        {announcement.type === 'workout_schedule' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">주간 운동 일정</h2>
            {renderWorkoutSchedule(announcement.content)}
          </div>
        )}
      </div>
    </div>
  );
}