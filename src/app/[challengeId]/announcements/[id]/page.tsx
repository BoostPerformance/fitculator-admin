'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import { Youtube } from '@/extensions/youtube';

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

const statusConfig = {
  draft: {
    label: '초안',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-300',
    dot: 'bg-slate-400'
  },
  published: {
    label: '발행됨',
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500'
  },
  archived: {
    label: '보관됨',
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500'
  }
};

const typeConfig = {
  general: {
    bg: 'bg-violet-50 dark:bg-violet-900/30',
    text: 'text-violet-700 dark:text-violet-400'
  },
  workout_schedule: {
    bg: 'bg-sky-50 dark:bg-sky-900/30',
    text: 'text-sky-700 dark:text-sky-400'
  }
};

const workoutTypeColors: { [key: string]: string } = {
  'Running Performance': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
  'Hyrox Flow': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
  'Strength Endurance': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
  'Team of 2': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
  'RoxFlow- Test': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
  'default': 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
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
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Tiptap JSON을 HTML로 변환
  const renderTiptapContent = (content: any): string => {
    try {
      return generateHTML(content, [
        StarterKit,
        Link,
        Image,
        Underline,
        Youtube,
      ]);
    } catch (error) {
      console.error('Error generating HTML from Tiptap content:', error);
      return '';
    }
  };

  const renderWorkoutSchedule = (content: any) => {
    if (!content.days) return null;

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    return (
      <div className="space-y-3">
        {days.map(dayKey => {
          const day: WorkoutDay = content.days[dayKey];
          if (!day) return null;

          const isExpanded = expandedDays[dayKey];

          return (
            <div key={dayKey} className="border border-slate-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleDayExpansion(dayKey)}
                className="w-full px-4 py-3 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-slate-900 dark:text-white">{day.korean_name}</span>
                  <span className="text-slate-400 dark:text-slate-500 text-sm">({day.english_name})</span>
                  {day.sessions && day.sessions.length > 0 && day.sessions[0].type && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      workoutTypeColors[day.sessions[0].type] || workoutTypeColors.default
                    }`}>
                      {day.sessions[0].type}
                    </span>
                  )}
                </div>
                {isExpanded ? <ChevronUp size={16} className="text-slate-400 dark:text-slate-500" /> : <ChevronDown size={16} className="text-slate-400 dark:text-slate-500" />}
              </button>

              {isExpanded && day.sessions && (
                <div className="border-t border-slate-200 dark:border-gray-700 p-4 bg-slate-50/50 dark:bg-gray-800/50">
                  {day.sessions.map((session, sessionIndex) => (
                    <div key={sessionIndex} className="space-y-3">
                      {session.time && (
                        <div className="text-sm text-slate-600 dark:text-slate-300">
                          <strong>시간:</strong> {session.time}
                        </div>
                      )}

                      {session.warmup && session.warmup.length > 0 && (
                        <div>
                          <h4 className="font-medium text-slate-700 dark:text-slate-200 mb-2 text-sm">워밍업</h4>
                          <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400 ml-4">
                            {session.warmup.map((item, i) => (
                              <div key={i}>{item}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {session.main_session && (
                        <div>
                          <h4 className="font-medium text-slate-700 dark:text-slate-200 mb-2 text-sm">메인 세션</h4>
                          <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-slate-200 dark:border-gray-700">
                            <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 font-mono">
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
          <div className="mt-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg p-4 border border-sky-100 dark:border-sky-800">
            <h4 className="font-medium text-sky-900 dark:text-sky-300 mb-2 text-sm">참고사항</h4>
            {content.notes.safety && (
              <p className="text-sm text-sky-800 dark:text-sky-400 mb-2">{content.notes.safety}</p>
            )}
            {content.notes.general && (
              <p className="text-sm text-sky-800 dark:text-sky-400 mb-2">{content.notes.general}</p>
            )}
            {content.notes.abbreviations && (
              <div className="mt-3">
                <p className="text-sm font-medium text-sky-900 dark:text-sky-300 mb-1">약어 설명:</p>
                {Object.entries(content.notes.abbreviations).map(([abbr, meaning]) => (
                  <p key={abbr} className="text-sm text-sky-800 dark:text-sky-400">
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
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-4 bg-slate-100 dark:bg-gray-700 rounded w-16"></div>
            <div className="h-8 bg-slate-100 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-3 bg-slate-100 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-px bg-slate-100 dark:bg-gray-700 w-full"></div>
            <div className="space-y-3">
              <div className="h-4 bg-slate-100 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-slate-100 dark:bg-gray-700 rounded w-5/6"></div>
              <div className="h-4 bg-slate-100 dark:bg-gray-700 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <p className="text-slate-500 dark:text-slate-400 text-sm">공지사항을 찾을 수 없습니다.</p>
          <button
            onClick={() => router.push(`/${challengeId}/announcements`)}
            className="mt-2 text-slate-900 dark:text-white text-sm hover:underline"
          >
            ← 목록으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Back button */}
        <button
          onClick={() => router.push(`/${challengeId}/announcements`)}
          className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          목록으로
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-8">
          <div className="flex-1">
            {/* Title */}
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight mb-3">
              {announcement.title}
            </h1>

            {/* Tags */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded ${statusConfig[announcement.status].bg} ${statusConfig[announcement.status].text}`}>
                <span className={`w-1 h-1 rounded-full ${statusConfig[announcement.status].dot}`}></span>
                {statusConfig[announcement.status].label}
              </span>
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${typeConfig[announcement.type].bg} ${typeConfig[announcement.type].text}`}>
                {typeLabels[announcement.type]}
              </span>
              {announcement.priority > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                  중요
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => router.push(`/${challengeId}/announcements/edit/${announcement.id}`)}
              className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Edit size={14} />
              수정
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 text-sm text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              삭제
            </button>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="border border-slate-200 dark:border-gray-700 rounded-lg overflow-hidden">

          {/* Meta Info */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
              <div>
                <span className="text-slate-400 dark:text-slate-500">작성</span>
                <span className="ml-2 text-slate-600 dark:text-slate-300">{formatDateTime(announcement.created_at)}</span>
              </div>
              {announcement.published_at && (
                <div>
                  <span className="text-slate-400 dark:text-slate-500">발행</span>
                  <span className="ml-2 text-slate-600 dark:text-slate-300">{formatDateTime(announcement.published_at)}</span>
                </div>
              )}
              {announcement.start_date && announcement.end_date && (
                <div>
                  <span className="text-slate-400 dark:text-slate-500">게시기간</span>
                  <span className="ml-2 text-slate-600 dark:text-slate-300">{formatDate(announcement.start_date)} - {formatDate(announcement.end_date)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {announcement.type === 'general' && (
              <>
                {/* Tiptap JSON 형식 (type: 'doc') */}
                {announcement.content?.type === 'doc' && (
                  <div
                    className="tiptap-content prose prose-slate dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: renderTiptapContent(announcement.content) }}
                  />
                )}
                {/* 레거시 텍스트 형식 ({ text: string }) */}
                {announcement.content?.text && !announcement.content?.type && (
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-slate-700 dark:text-slate-300 leading-relaxed">
                      {announcement.content.text}
                    </pre>
                  </div>
                )}
              </>
            )}

            {announcement.type === 'workout_schedule' && (
              <div>
                <h2 className="text-sm font-medium text-slate-900 dark:text-white mb-4">주간 운동 일정</h2>
                {renderWorkoutSchedule(announcement.content)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
