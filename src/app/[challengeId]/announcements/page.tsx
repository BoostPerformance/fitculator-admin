'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Edit2, FileText, Calendar, Bell, Flag, ChevronDown } from 'lucide-react';

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

const typeLabels = {
  general: '일반',
  workout_schedule: '운동 일정'
};

const statusLabels = {
  draft: '초안',
  published: '발행됨',
  archived: '보관됨'
};

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-yellow-100 text-yellow-800'
};

export default function AnnouncementsPage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.challengeId as string;

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('challengeId', challengeId);
      
      if (selectedType !== 'all') {
        params.append('type', selectedType);
      }
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }

      const response = await fetch(`/api/announcements?${params}`);
      if (!response.ok) throw new Error('Failed to fetch announcements');
      
      const data = await response.json();
      setAnnouncements(data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [challengeId, selectedType, selectedStatus]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getContentPreview = (announcement: Announcement) => {
    if (announcement.type === 'general' && announcement.content?.text) {
      const text = announcement.content.text.replace(/\\n/g, ' ');
      return text.length > 50 ? text.substring(0, 50) + '...' : text;
    }
    if (announcement.type === 'workout_schedule') {
      return '주간 운동 일정';
    }
    return announcement.title;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">공지사항 관리</h1>
        <button
          onClick={() => router.push(`/${challengeId}/announcements/create`)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={16} />
          새 공지사항
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">모든 유형</option>
          <option value="general">일반</option>
          <option value="workout_schedule">운동 일정</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">모든 상태</option>
          <option value="draft">초안</option>
          <option value="published">발행됨</option>
          <option value="archived">보관됨</option>
        </select>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4 flex justify-center">
              <FileText size={48} className="opacity-50" />
            </div>
            <p className="text-gray-500">공지사항이 없습니다.</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/${challengeId}/announcements/${announcement.id}`)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${statusColors[announcement.status]}`}
                  >
                    {statusLabels[announcement.status]}
                  </span>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {typeLabels[announcement.type]}
                  </span>
                  {announcement.priority > 0 && (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                      우선순위 {announcement.priority}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/${challengeId}/announcements/edit/${announcement.id}`);
                    }}
                    className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {announcement.title}
              </h3>

              <p className="text-gray-600 text-sm mb-3">
                {getContentPreview(announcement)}
              </p>

              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>
                  {announcement.published_at
                    ? `발행일: ${formatDate(announcement.published_at)}`
                    : `작성일: ${formatDate(announcement.created_at)}`}
                </span>
                {announcement.start_date && announcement.end_date && (
                  <span>
                    게시기간: {formatDate(announcement.start_date)} ~ {formatDate(announcement.end_date)}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}