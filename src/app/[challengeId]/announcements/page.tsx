'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Edit2, FileText, MoreHorizontal, Eye, Trash2, ArrowUpDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Title from '@/components/layout/title';

interface Announcement {
  id: string;
  title: string;
  type: 'general' | 'workout_schedule';
  content: any;
  status: 'draft' | 'published' | 'archived';
  priority: number;
  show_on_main?: boolean;
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

const statusConfig = {
  draft: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-300',
    dot: 'bg-slate-400'
  },
  published: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500'
  },
  archived: {
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500'
  }
};

const typeConfig = {
  general: {
    bg: 'bg-violet-50 dark:bg-violet-900/30',
    text: 'text-violet-700 dark:text-violet-400',
    border: 'border-violet-200 dark:border-violet-700'
  },
  workout_schedule: {
    bg: 'bg-sky-50 dark:bg-sky-900/30',
    text: 'text-sky-700 dark:text-sky-400',
    border: 'border-sky-200 dark:border-sky-700'
  }
};

export default function AnnouncementsPage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.challengeId as string;

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'created_at' | 'start_date'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('정말로 이 공지사항을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('삭제에 실패했습니다.');
    }
    setOpenMenuId(null);
  };

  // 정렬된 공지사항
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    const aValue = sortField === 'created_at' ? a.created_at : (a.start_date || '');
    const bValue = sortField === 'created_at' ? b.created_at : (b.start_date || '');
    if (sortOrder === 'asc') {
      return aValue.localeCompare(bValue);
    }
    return bValue.localeCompare(aValue);
  });

  // 통계 계산
  const stats = {
    total: announcements.length,
    published: announcements.filter(a => a.status === 'published').length,
    draft: announcements.filter(a => a.status === 'draft').length,
  };

  const handleSort = (field: 'created_at' | 'start_date') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-slate-200 dark:bg-gray-700 rounded-lg w-1/4"></div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-slate-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-slate-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        {/* Header */}
        <div className="flex flex-row sm:flex-col justify-between items-center sm:items-start gap-0 sm:gap-4 mb-8 sm:mb-6">
          <Title title="공지사항" subtitle="챌린지 참여자에게 전달할 공지사항을 관리합니다" />
          <button
            onClick={() => router.push(`/${challengeId}/announcements/create`)}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-slate-900 px-5 sm:px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 font-medium shadow-sm hover:shadow-md min-h-[44px] text-base sm:text-sm w-auto sm:w-full justify-start sm:justify-center"
          >
            <Plus size={18} strokeWidth={2.5} />
            새 공지사항
          </button>
        </div>

        {/* List Header with Filters */}
        <div className="flex flex-row sm:flex-col items-center sm:items-start justify-between gap-0 sm:gap-3 mb-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">총 <span className="font-medium text-slate-700 dark:text-slate-200">{stats.total}개</span>의 공지사항</p>

          <div className="flex gap-2 w-auto sm:w-full">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[130px] sm:flex-1 bg-white dark:bg-gray-800 h-9 sm:h-11 text-sm dark:text-white dark:border-gray-600">
                <SelectValue placeholder="모든 유형" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600">
                <SelectItem value="all" className="dark:text-white dark:focus:bg-gray-700">모든 유형</SelectItem>
                <SelectItem value="general" className="dark:text-white dark:focus:bg-gray-700">일반</SelectItem>
                <SelectItem value="workout_schedule" className="dark:text-white dark:focus:bg-gray-700">운동 일정</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[130px] sm:flex-1 bg-white dark:bg-gray-800 h-9 sm:h-11 text-sm dark:text-white dark:border-gray-600">
                <SelectValue placeholder="모든 상태" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600">
                <SelectItem value="all" className="dark:text-white dark:focus:bg-gray-700">모든 상태</SelectItem>
                <SelectItem value="draft" className="dark:text-white dark:focus:bg-gray-700">초안</SelectItem>
                <SelectItem value="published" className="dark:text-white dark:focus:bg-gray-700">발행됨</SelectItem>
                <SelectItem value="archived" className="dark:text-white dark:focus:bg-gray-700">보관됨</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Announcements - Desktop: Table, Mobile: Cards */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200/60 dark:border-gray-700 shadow-sm overflow-hidden">
          {sortedAnnouncements.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={24} className="text-slate-400 dark:text-gray-500 sm:hidden" />
                <FileText size={28} className="text-slate-400 dark:text-gray-500 hidden sm:block" />
              </div>
              <p className="text-slate-600 dark:text-slate-300 font-medium text-sm sm:text-base">공지사항이 없습니다</p>
              <p className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm mt-1">새 공지사항을 작성해보세요</p>
              <button
                onClick={() => router.push(`/${challengeId}/announcements/create`)}
                className="mt-4 text-slate-900 dark:text-white font-medium text-sm hover:underline min-h-[44px] px-4"
              >
                공지사항 작성하기 →
              </button>
            </div>
          ) : (
            <>
              {/* 모바일 카드 뷰 */}
              <div className="hidden sm:block divide-y divide-slate-100 dark:divide-gray-700">
                {sortedAnnouncements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="p-4 active:bg-slate-50 dark:active:bg-gray-700/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/${challengeId}/announcements/${announcement.id}`)}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-medium text-slate-900 dark:text-white text-sm flex-1 line-clamp-2">{announcement.title}</h3>
                      <div className="relative flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === announcement.id ? null : announcement.id);
                          }}
                          className="p-2 hover:bg-slate-200 dark:hover:bg-gray-600 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                        >
                          <MoreHorizontal size={18} className="text-slate-400 dark:text-slate-500" />
                        </button>

                        {openMenuId === announcement.id && (
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-slate-200 dark:border-gray-700 py-1 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/${challengeId}/announcements/${announcement.id}`);
                              }}
                              className="w-full px-3 py-2.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Eye size={14} />
                              보기
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/${challengeId}/announcements/edit/${announcement.id}`);
                              }}
                              className="w-full px-3 py-2.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Edit2 size={14} />
                              수정
                            </button>
                            <div className="border-t border-slate-100 dark:border-gray-700 my-1"></div>
                            <button
                              onClick={(e) => handleDelete(e, announcement.id)}
                              className="w-full px-3 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 flex items-center gap-2"
                            >
                              <Trash2 size={14} />
                              삭제
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {announcement.show_on_main && (
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                          메인
                        </span>
                      )}
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${typeConfig[announcement.type].bg} ${typeConfig[announcement.type].text}`}>
                        {typeLabels[announcement.type]}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${statusConfig[announcement.status].bg} ${statusConfig[announcement.status].text}`}>
                        <span className={`w-1 h-1 rounded-full ${statusConfig[announcement.status].dot}`}></span>
                        {statusLabels[announcement.status]}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                      <div>작성일: {formatDate(announcement.created_at)}</div>
                      {announcement.start_date && announcement.end_date && (
                        <div>게시기간: {formatDate(announcement.start_date)} - {formatDate(announcement.end_date)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* 데스크톱 테이블 뷰 */}
              <table className="w-full sm:hidden">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50">
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">제목</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[80px]">순서</th>
                    <th
                      className="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 select-none w-[150px]"
                      onClick={() => handleSort('created_at')}
                    >
                      <span className="flex items-center gap-1">
                        작성일
                        <ArrowUpDown size={14} className={sortField === 'created_at' ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'} />
                      </span>
                    </th>
                    <th
                      className="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 select-none w-[280px]"
                      onClick={() => handleSort('start_date')}
                    >
                      <span className="flex items-center gap-1">
                        게시기간
                        <ArrowUpDown size={14} className={sortField === 'start_date' ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'} />
                      </span>
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[200px]">상태</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                  {sortedAnnouncements.map((announcement) => (
                    <tr
                      key={announcement.id}
                      className="group hover:bg-slate-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/${challengeId}/announcements/${announcement.id}`)}
                    >
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-900 dark:text-white text-sm">{announcement.title}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm text-slate-500 dark:text-slate-400">{announcement.priority}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(announcement.created_at)}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">
                        {announcement.start_date && announcement.end_date
                          ? `${formatDate(announcement.start_date)} - ${formatDate(announcement.end_date)}`
                          : '-'
                        }
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {announcement.show_on_main && (
                            <span className="px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                              메인
                            </span>
                          )}
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${typeConfig[announcement.type].bg} ${typeConfig[announcement.type].text}`}>
                            {typeLabels[announcement.type]}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${statusConfig[announcement.status].bg} ${statusConfig[announcement.status].text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[announcement.status].dot}`}></span>
                            {statusLabels[announcement.status]}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === announcement.id ? null : announcement.id);
                            }}
                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-gray-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal size={16} className="text-slate-400 dark:text-slate-500" />
                          </button>

                          {openMenuId === announcement.id && (
                            <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-slate-200 dark:border-gray-700 py-1 z-10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/${challengeId}/announcements/${announcement.id}`);
                                }}
                                className="w-full px-3 py-1.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Eye size={14} />
                                보기
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/${challengeId}/announcements/edit/${announcement.id}`);
                                }}
                                className="w-full px-3 py-1.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Edit2 size={14} />
                                수정
                              </button>
                              <div className="border-t border-slate-100 dark:border-gray-700 my-1"></div>
                              <button
                                onClick={(e) => handleDelete(e, announcement.id)}
                                className="w-full px-3 py-1.5 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 flex items-center gap-2"
                              >
                                <Trash2 size={14} />
                                삭제
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
