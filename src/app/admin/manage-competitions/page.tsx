'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Title from '@/components/layout/title';

interface CompetitionEvent {
  id: string;
  competition_type: 'hyrox' | 'marathon';
  name_ko: string;
  name_en: string;
  location: string | null;
  city_ko: string | null;
  city_en: string | null;
  country_ko: string | null;
  country_en: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  sort_order: number;
}

interface UserRecordedGroup {
  competition_type: string;
  event_name_en: string | null;
  event_name_ko: string | null;
  record_count: number;
  first_recorded: string | null;
  last_recorded: string | null;
  users: string[];
  locations: string[];
}

interface LinkDialogState {
  show: boolean;
  eventId: string;
  eventNameEn: string | null;
  eventNameKo: string | null;
  competitionType: string;
  recordCount: number;
}

type FormData = Omit<CompetitionEvent, 'id'>;

const emptyForm: FormData = {
  competition_type: 'hyrox',
  name_ko: '',
  name_en: '',
  location: '',
  city_ko: '',
  city_en: '',
  country_ko: '',
  country_en: '',
  start_date: '',
  end_date: '',
  is_active: true,
  sort_order: 0,
};

const fieldLabels: Record<string, string> = {
  competition_type: '대회 종류',
  name_ko: '대회명 (한글)',
  name_en: '대회명 (영문)',
  location: '장소',
  city_ko: '도시 (한글)',
  city_en: '도시 (영문)',
  country_ko: '국가 (한글)',
  country_en: '국가 (영문)',
  start_date: '시작일',
  end_date: '종료일',
  is_active: '활성 상태',
  sort_order: '정렬 순서',
};

function toFormData(event: CompetitionEvent): FormData {
  return {
    competition_type: event.competition_type,
    name_ko: event.name_ko,
    name_en: event.name_en,
    location: event.location || '',
    city_ko: event.city_ko || '',
    city_en: event.city_en || '',
    country_ko: event.country_ko || '',
    country_en: event.country_en || '',
    start_date: event.start_date || '',
    end_date: event.end_date || '',
    is_active: event.is_active,
    sort_order: event.sort_order,
  };
}

function formatValue(key: string, value: unknown): string {
  if (key === 'competition_type') return value === 'hyrox' ? 'HYROX' : '마라톤';
  if (key === 'is_active') return value ? '활성' : '비활성';
  if (value === '' || value === null || value === undefined) return '(없음)';
  return String(value);
}

function competitionTypeLabel(type: string) {
  return type === 'hyrox' ? 'HYROX' : type === 'marathon' ? '마라톤' : type;
}

export default function ManageCompetitionsPage() {
  const [events, setEvents] = useState<CompetitionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | 'hyrox' | 'marathon'>('all');
  const [mainTab, setMainTab] = useState<'catalog' | 'user-recorded'>('catalog');

  // 사용자 기록 대회
  const [userRecords, setUserRecords] = useState<UserRecordedGroup[]>([]);
  const [userRecordsLoading, setUserRecordsLoading] = useState(false);

  // 연결 다이얼로그
  const [linkDialog, setLinkDialog] = useState<LinkDialogState | null>(null);
  const [linking, setLinking] = useState(false);
  // "공식 등록" 플로우에서 온 경우의 원래 사용자 기록 정보
  const [pendingLinkInfo, setPendingLinkInfo] = useState<{
    eventNameEn: string | null;
    eventNameKo: string | null;
    competitionType: string;
    recordCount: number;
  } | null>(null);

  // 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CompetitionEvent | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [originalForm, setOriginalForm] = useState<FormData>(emptyForm);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isEditMode = editingEvent !== null;

  const filteredEvents = useMemo(() => {
    if (typeFilter === 'all') return events;
    return events.filter((e) => e.competition_type === typeFilter);
  }, [events, typeFilter]);

  const typeCounts = useMemo(() => {
    if (mainTab === 'catalog') {
      return {
        all: events.length,
        hyrox: events.filter((e) => e.competition_type === 'hyrox').length,
        marathon: events.filter((e) => e.competition_type === 'marathon').length,
      };
    }
    return {
      all: userRecords.length,
      hyrox: userRecords.filter((r) => r.competition_type === 'hyrox').length,
      marathon: userRecords.filter((r) => r.competition_type === 'marathon').length,
    };
  }, [mainTab, events, userRecords]);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/competition-events');
      if (!response.ok) throw new Error('대회 데이터를 가져오는데 실패했습니다.');
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserRecords = useCallback(async () => {
    try {
      setUserRecordsLoading(true);
      const params = typeFilter !== 'all' ? `?type=${typeFilter}` : '';
      const response = await fetch(`/api/competition-events/user-recorded${params}`);
      if (!response.ok) throw new Error('사용자 기록 대회를 가져오는데 실패했습니다.');
      const data = await response.json();
      setUserRecords(data);
    } catch (err) {
      console.error('Failed to fetch user records:', err);
    } finally {
      setUserRecordsLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    if (mainTab === 'catalog') {
      fetchEvents();
    } else {
      fetchUserRecords();
    }
  }, [mainTab, fetchEvents, fetchUserRecords]);

  // 변경된 필드 계산
  const changedFields = useMemo(() => {
    if (!isEditMode) return [];
    const changes: { key: string; from: string; to: string }[] = [];
    for (const key of Object.keys(form) as (keyof FormData)[]) {
      const oldVal = String(originalForm[key] ?? '');
      const newVal = String(form[key] ?? '');
      if (oldVal !== newVal) {
        changes.push({
          key,
          from: formatValue(key, originalForm[key]),
          to: formatValue(key, form[key]),
        });
      }
    }
    return changes;
  }, [form, originalForm, isEditMode]);

  const hasChanges = isEditMode ? changedFields.length > 0 : true;

  const isFormValid = form.name_ko.trim() !== '' && form.name_en.trim() !== '';

  // 모달 열기: 새로 추가
  const openAddModal = () => {
    setEditingEvent(null);
    setForm(emptyForm);
    setOriginalForm(emptyForm);
    setShowConfirm(false);
    setShowDeleteConfirm(false);
    setError(null);
    setModalOpen(true);
  };

  // 모달 열기: 수정
  const openEditModal = (event: CompetitionEvent) => {
    const data = toFormData(event);
    setEditingEvent(event);
    setForm(data);
    setOriginalForm(data);
    setShowConfirm(false);
    setShowDeleteConfirm(false);
    setError(null);
    setModalOpen(true);
  };

  // 모달 열기: 사용자 기록 대회 → 공식 등록
  const openRegisterModal = (record: UserRecordedGroup) => {
    const prefilled: FormData = {
      ...emptyForm,
      competition_type: record.competition_type as 'hyrox' | 'marathon',
      name_en: record.event_name_en || '',
      name_ko: record.event_name_ko || '',
      location: record.locations.length > 0 ? record.locations[0] : '',
    };
    setEditingEvent(null);
    setForm(prefilled);
    setOriginalForm(emptyForm);
    setShowConfirm(false);
    setShowDeleteConfirm(false);
    setError(null);
    setPendingLinkInfo({
      eventNameEn: record.event_name_en,
      eventNameKo: record.event_name_ko,
      competitionType: record.competition_type,
      recordCount: record.record_count,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingEvent(null);
    setForm(emptyForm);
    setOriginalForm(emptyForm);
    setShowConfirm(false);
    setShowDeleteConfirm(false);
    setError(null);
    setPendingLinkInfo(null);
  };

  // 저장 버튼 클릭
  const handleSaveClick = () => {
    if (!isFormValid) {
      setError('한글명과 영문명은 필수입니다.');
      return;
    }
    if (isEditMode && changedFields.length > 0) {
      setShowConfirm(true);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      const url = editingEvent
        ? `/api/competition-events/${editingEvent.id}`
        : '/api/competition-events';
      const method = editingEvent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          location: form.location || null,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          city_ko: form.city_ko || null,
          city_en: form.city_en || null,
          country_ko: form.country_ko || null,
          country_en: form.country_en || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '저장에 실패했습니다.');
      }

      // 공식 등록 플로우에서 온 경우: 연결 다이얼로그 표시
      if (!editingEvent && pendingLinkInfo) {
        const created = await response.json();
        setModalOpen(false);
        setForm(emptyForm);
        setOriginalForm(emptyForm);
        setError(null);
        setLinkDialog({
          show: true,
          eventId: created.id,
          eventNameEn: pendingLinkInfo.eventNameEn,
          eventNameKo: pendingLinkInfo.eventNameKo,
          competitionType: pendingLinkInfo.competitionType,
          recordCount: pendingLinkInfo.recordCount,
        });
        setPendingLinkInfo(null);
        await fetchEvents();
        return;
      }

      closeModal();
      await fetchEvents();
    } catch (err) {
      setShowConfirm(false);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingEvent) return;
    try {
      setSaving(true);
      setError(null);
      const response = await fetch(`/api/competition-events/${editingEvent.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '삭제에 실패했습니다.');
      }
      closeModal();
      await fetchEvents();
    } catch (err) {
      setShowDeleteConfirm(false);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleLinkRecords = async () => {
    if (!linkDialog) return;
    setLinking(true);
    try {
      const response = await fetch('/api/competition-events/link-records', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: linkDialog.eventId,
          eventNameEn: linkDialog.eventNameEn,
          eventNameKo: linkDialog.eventNameKo,
          competitionType: linkDialog.competitionType,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '연결에 실패했습니다.');
      alert(`${data.updated_count}개의 기록이 연결되었습니다.`);
      setLinkDialog(null);
      await fetchUserRecords();
    } catch (err) {
      alert(err instanceof Error ? err.message : '연결에 실패했습니다.');
    } finally {
      setLinking(false);
    }
  };

  const handleSkipLink = () => {
    setLinkDialog(null);
    if (mainTab === 'user-recorded') fetchUserRecords();
  };

  const filteredUserRecords = useMemo(() => {
    if (typeFilter === 'all') return userRecords;
    return userRecords.filter((r) => r.competition_type === typeFilter);
  }, [userRecords, typeFilter]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <Title title="대회 관리" />
        {mainTab === 'catalog' && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white pl-3 pr-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="8" y1="3" x2="8" y2="13" /><line x1="3" y1="8" x2="13" y2="8" />
            </svg>
            대회 추가
          </button>
        )}
      </div>

      {error && !modalOpen && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {/* 메인 탭 */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setMainTab('catalog')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mainTab === 'catalog'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          공식 대회 목록
        </button>
        <button
          onClick={() => setMainTab('user-recorded')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mainTab === 'user-recorded'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          사용자 기록 대회
        </button>
      </div>

      {/* 종류 필터 탭 */}
      <div className="flex gap-1 mb-4">
        {([
          { key: 'all', label: '전체' },
          { key: 'hyrox', label: 'HYROX' },
          { key: 'marathon', label: '마라톤' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTypeFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              typeFilter === key
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {label}
            <span className={`ml-1.5 text-xs ${typeFilter === key ? 'text-gray-400 dark:text-gray-500' : 'text-gray-400 dark:text-gray-500'}`}>
              {typeCounts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* 공식 대회 테이블 */}
      {mainTab === 'catalog' && (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading && events.length === 0 ? (
          <div className="text-center py-20 text-gray-400">로딩 중...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-gray-300 dark:text-gray-600 mb-3">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              {events.length === 0 ? '등록된 대회가 없습니다' : '해당 종류의 대회가 없습니다'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">종류</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">대회명</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">위치</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">기간</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {filteredEvents.map((event) => (
                  <tr
                    key={event.id}
                    onClick={() => openEditModal(event)}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-md ${
                        event.competition_type === 'hyrox'
                          ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800'
                          : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800'
                      }`}>
                        {competitionTypeLabel(event.competition_type)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900 dark:text-white text-sm">{event.name_ko}</div>
                      <div className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">{event.name_en}</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {[event.location, event.city_ko, event.country_ko].filter(Boolean).join(', ') || <span className="text-gray-300 dark:text-gray-600">-</span>}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {event.start_date && event.end_date
                        ? `${event.start_date} ~ ${event.end_date}`
                        : event.start_date || event.end_date || <span className="text-gray-300 dark:text-gray-600">-</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        event.is_active
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${event.is_active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                        {event.is_active ? '활성' : '비활성'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* 사용자 기록 대회 테이블 */}
      {mainTab === 'user-recorded' && (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {userRecordsLoading ? (
          <div className="text-center py-20 text-gray-400">로딩 중...</div>
        ) : filteredUserRecords.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-gray-300 dark:text-gray-600 mb-3">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto">
                <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="8" y="2" width="8" height="4" rx="1" />
              </svg>
            </div>
            <p className="text-gray-400 dark:text-gray-500 text-sm">미등록 대회 기록이 없습니다</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">종류</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">대회명</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">기록 수</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">기록자</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">위치</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">대회 날짜</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {filteredUserRecords.map((record, i) => (
                  <tr key={`${record.event_name_en}-${record.event_name_ko}-${i}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-md ${
                        record.competition_type === 'hyrox'
                          ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800'
                          : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800'
                      }`}>
                        {competitionTypeLabel(record.competition_type)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900 dark:text-white text-sm">{record.event_name_en || record.event_name_ko}</div>
                      {record.event_name_en && record.event_name_ko && (
                        <div className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">{record.event_name_ko}</div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800">
                        {record.record_count}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {record.users.length > 0 ? record.users.map((name, j) => (
                          <span key={j} className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            {name}
                          </span>
                        )) : <span className="text-gray-300 dark:text-gray-600 text-xs">-</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {record.locations.length > 0
                        ? record.locations.join(', ')
                        : <span className="text-gray-300 dark:text-gray-600">-</span>}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {record.first_recorded && record.last_recorded && record.first_recorded !== record.last_recorded
                        ? `${record.first_recorded} ~ ${record.last_recorded}`
                        : record.first_recorded || <span className="text-gray-300 dark:text-gray-600">-</span>}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => openRegisterModal(record)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M6 2v8M2 6h8" />
                        </svg>
                        공식 등록
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* 모달 */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-[820px] overflow-hidden flex flex-col">
            {/* 변경사항 확인 뷰 */}
            {showConfirm ? (
              <div className="p-6">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-600 dark:text-blue-400">
                    <path d="M9 5l7 7-7 7" /><path d="M4 5l7 7-7 7" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">변경사항 확인</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">아래 내용으로 수정됩니다.</p>

                <div className="space-y-2 mb-6">
                  {changedFields.map(({ key, from, to }) => (
                    <div key={key} className="flex items-start gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3.5">
                      <div className="min-w-[80px] shrink-0">
                        <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{fieldLabels[key] || key}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm min-w-0">
                        <span className="text-gray-400 line-through truncate">{from}</span>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-300 dark:text-gray-500 shrink-0">
                          <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-blue-600 dark:text-blue-400 font-medium truncate">{to}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-3 py-2 rounded-lg mb-4 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    돌아가기
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {saving ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>

            ) : showDeleteConfirm ? (
              /* 삭제 확인 뷰 */
              <div className="p-6">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-4">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-600 dark:text-red-400">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">대회를 삭제할까요?</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">이 작업은 되돌릴 수 없습니다.</p>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl px-4 py-3.5 mb-6 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    editingEvent?.competition_type === 'hyrox'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                      : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {editingEvent?.competition_type === 'hyrox' ? 'H' : 'M'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white text-sm truncate">{editingEvent?.name_ko}</div>
                    <div className="text-gray-400 dark:text-gray-500 text-xs truncate">{editingEvent?.name_en}</div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-3 py-2 rounded-lg mb-4 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {saving ? '삭제 중...' : '삭제'}
                  </button>
                </div>
              </div>

            ) : (
              /* 폼 뷰 */
              <>
                {/* 헤더 */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      {isEditMode ? '대회 수정' : '새 대회 등록'}
                    </h2>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
                      {isEditMode ? '대회 정보를 수정합니다.' : '사전 등록할 대회 정보를 입력해주세요.'}
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="3" y1="3" x2="13" y2="13" /><line x1="13" y1="3" x2="3" y2="13" />
                    </svg>
                  </button>
                </div>

                {/* 본문 - 2열 레이아웃 */}
                <div className="px-6 py-5">
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-3.5 py-2.5 rounded-xl text-sm flex items-center gap-2 mb-5">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                        <line x1="8" y1="5" x2="8" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
                      </svg>
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-5">
                    {/* 왼쪽: 기본 정보 */}
                    <div className="space-y-5">
                      {/* 대회 종류 */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-blue-600 dark:text-blue-400">
                              <rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                              <path d="M4 6h4M6 4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </div>
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">기본 정보</span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">대회 종류</label>
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => setForm({ ...form, competition_type: 'hyrox' })}
                                className={`relative px-4 py-3 rounded-xl border-2 text-left transition-all ${
                                  form.competition_type === 'hyrox'
                                    ? 'border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                }`}
                              >
                                <div className="font-semibold text-sm text-gray-900 dark:text-white">HYROX</div>
                                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">피트니스 레이스</div>
                                {form.competition_type === 'hyrox' && (
                                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                  </div>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => setForm({ ...form, competition_type: 'marathon' })}
                                className={`relative px-4 py-3 rounded-xl border-2 text-left transition-all ${
                                  form.competition_type === 'marathon'
                                    ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                }`}
                              >
                                <div className="font-semibold text-sm text-gray-900 dark:text-white">마라톤</div>
                                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">로드 레이스</div>
                                {form.competition_type === 'marathon' && (
                                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center">
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                  </div>
                                )}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">대회명 (한글) <span className="text-red-400">*</span></label>
                            <input
                              type="text"
                              value={form.name_ko}
                              onChange={(e) => setForm({ ...form, name_ko: e.target.value })}
                              placeholder="예: 하이록스 서울"
                              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">대회명 (영문) <span className="text-red-400">*</span></label>
                            <input
                              type="text"
                              value={form.name_en}
                              onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                              placeholder="e.g. HYROX Seoul"
                              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 오른쪽: 위치 + 일정 */}
                    <div className="space-y-5">
                      {/* 위치 */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 rounded-md bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-purple-600 dark:text-purple-400">
                              <path d="M6 1C4.067 1 2.5 2.567 2.5 4.5C2.5 7.25 6 11 6 11s3.5-3.75 3.5-6.5C9.5 2.567 7.933 1 6 1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                              <circle cx="6" cy="4.5" r="1.25" stroke="currentColor" strokeWidth="1.2" />
                            </svg>
                          </div>
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">위치</span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">장소</label>
                            <input type="text" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. COEX, KINTEX" className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">도시 (한글)</label>
                              <input type="text" value={form.city_ko || ''} onChange={(e) => setForm({ ...form, city_ko: e.target.value })} placeholder="서울" className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">도시 (영문)</label>
                              <input type="text" value={form.city_en || ''} onChange={(e) => setForm({ ...form, city_en: e.target.value })} placeholder="Seoul" className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">국가 (한글)</label>
                              <input type="text" value={form.country_ko || ''} onChange={(e) => setForm({ ...form, country_ko: e.target.value })} placeholder="대한민국" className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">국가 (영문)</label>
                              <input type="text" value={form.country_en || ''} onChange={(e) => setForm({ ...form, country_en: e.target.value })} placeholder="South Korea" className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 일정 & 설정 */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 rounded-md bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-orange-600 dark:text-orange-400">
                              <rect x="1.5" y="2" width="9" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                              <line x1="1.5" y1="5" x2="10.5" y2="5" stroke="currentColor" strokeWidth="1.2" />
                              <line x1="4" y1="1" x2="4" y2="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                              <line x1="8" y1="1" x2="8" y2="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                            </svg>
                          </div>
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">일정 & 설정</span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">시작일</label>
                              <input type="date" value={form.start_date || ''} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all dark:text-white" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">종료일</label>
                              <input type="date" value={form.end_date || ''} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all dark:text-white" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">정렬 순서</label>
                              <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all dark:text-white" />
                            </div>
                            <div className="flex items-end pb-0.5">
                              <div className="flex items-center justify-between w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3.5 py-2.5">
                                <span className="text-sm text-gray-700 dark:text-gray-300">활성</span>
                                <button
                                  type="button"
                                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                                  className={`relative w-10 h-[22px] rounded-full transition-colors ${
                                    form.is_active ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-500'
                                  }`}
                                >
                                  <span className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform ${
                                    form.is_active ? 'translate-x-[18px]' : ''
                                  }`} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 푸터 */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3 bg-gray-50/50 dark:bg-gray-800">
                  {isEditMode && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="shrink-0">
                        <path d="M2 4h10M5.5 4V2.5a1 1 0 011-1h1a1 1 0 011 1V4m1.5 0v7.5a1 1 0 01-1 1h-5a1 1 0 01-1-1V4h8z" />
                      </svg>
                      삭제
                    </button>
                  )}
                  <div className="flex-1" />
                  <button
                    onClick={closeModal}
                    className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveClick}
                    disabled={!isFormValid || !hasChanges || saving}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md disabled:shadow-none"
                  >
                    {saving ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                        </svg>
                        저장 중
                      </span>
                    ) : isEditMode ? '저장' : '등록'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* 기존 기록 연결 다이얼로그 */}
      {linkDialog?.show && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleSkipLink(); }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-600 dark:text-emerald-400">
                <path d="M8 4H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2M11 1h5v5M16 1L8 9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">기존 기록 연결</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              &ldquo;{linkDialog.eventNameEn || linkDialog.eventNameKo}&rdquo; 이름으로 기록된{' '}
              <span className="font-semibold text-gray-900 dark:text-white">{linkDialog.recordCount}개</span>의
              기존 기록을 새 공식 대회에 연결하시겠습니까?
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleSkipLink}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                건너뛰기
              </button>
              <button
                onClick={handleLinkRecords}
                disabled={linking}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                {linking ? '연결 중...' : '연결'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
