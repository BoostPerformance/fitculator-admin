'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FiEdit2, FiSave, FiX, FiPlus, FiTrash2, FiUsers, FiSearch, FiChevronDown, FiCheck, FiUser, FiSettings } from 'react-icons/fi';

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
}

interface Participant {
  id: string;
  service_user_id: string;
  coach_memo: string;
  memo_updated_at: string;
  status: string;
  users: User;
  current_group: Group | null;
}

interface Group {
  id: string;
  name: string;
  color_code: string;
  sort_order: number;
}

export default function MembersPage() {
  const params = useParams();
  const challengeId = params.challengeId as string;

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [editingMemo, setEditingMemo] = useState<string | null>(null);
  const [memoText, setMemoText] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showGroupSettingsModal, setShowGroupSettingsModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupForm, setGroupForm] = useState({ name: '', color_code: '#6366f1', sort_order: 0 });
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [challengeTitle, setChallengeTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [savingMemo, setSavingMemo] = useState(false);

  // 참가자 목록 가져오기
  const fetchParticipants = async () => {
    try {
      const res = await fetch(`/api/challenge-participants?challenge_id=${challengeId}&limit=1000`);
      const data = await res.json();

      if (data.data && data.data.length > 0) {
        setChallengeTitle(data.data[0].challenges?.title || '');
      }

      setParticipants(data.data.filter((p: Participant) => p.status !== 'dropped'));
    } catch (error) {
      // console.error('참가자 목록 로딩 실패:', error);
    }
  };

  // 그룹 목록 가져오기
  const fetchGroups = async () => {
    try {
      const res = await fetch(`/api/challenge-groups?challenge_id=${challengeId}`);
      const data = await res.json();
      setGroups(data.data || []);
    } catch (error) {
      // console.error('그룹 목록 로딩 실패:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchParticipants(), fetchGroups()]);
      setLoading(false);
    };
    loadData();
  }, [challengeId]);

  // 코치메모 저장
  const saveMemo = async (participantId: string) => {
    setSavingMemo(true);
    try {
      const res = await fetch('/api/coach-memo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId,
          memo: memoText
        })
      });

      if (res.ok) {
        await fetchParticipants();
        setEditingMemo(null);
        setMemoText('');
      }
    } catch (error) {
      // console.error('메모 저장 실패:', error);
    } finally {
      setSavingMemo(false);
    }
  };

  // 그룹 생성/수정
  const saveGroup = async () => {
    try {
      const method = editingGroup ? 'PUT' : 'POST';
      const body = editingGroup
        ? { ...groupForm, id: editingGroup.id }
        : { ...groupForm, challenge_id: challengeId };

      const res = await fetch('/api/challenge-groups', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        await fetchGroups();
        setShowGroupModal(false);
        setEditingGroup(null);
        setGroupForm({ name: '', color_code: '#6366f1', sort_order: 0 });
      }
    } catch (error) {
      // console.error('그룹 저장 실패:', error);
    }
  };

  // 그룹 삭제
  const deleteGroup = async (groupId: string) => {
    if (!confirm('이 그룹을 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/challenge-groups?id=${groupId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        await fetchGroups();
        if (selectedGroup === groupId) {
          setSelectedGroup('all');
        }
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (error) {
      // console.error('그룹 삭제 실패:', error);
    }
  };

  // 참가자 그룹 할당
  const assignToGroup = async (participantId: string, groupId: string) => {
    try {
      const res = await fetch('/api/challenge-group-participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: participantId,
          group_id: groupId
        })
      });

      if (res.ok) {
        await fetchParticipants();
      }
    } catch (error) {
      // console.error('그룹 할당 실패:', error);
    }
  };

  // 선택된 참가자들 일괄 그룹 할당
  const bulkAssignToGroup = async (groupId: string) => {
    for (const participantId of selectedParticipants) {
      await assignToGroup(participantId, groupId);
    }
    setSelectedParticipants([]);
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedParticipants.length === filteredParticipants.length) {
      setSelectedParticipants([]);
    } else {
      setSelectedParticipants(filteredParticipants.map(p => p.id));
    }
  };

  // 필터링된 참가자 목록
  const filteredParticipants = participants
    .filter(p => {
      if (selectedGroup === 'all') return true;
      if (selectedGroup === 'none') return !p.current_group;
      return p.current_group?.id === selectedGroup;
    })
    .filter(p => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        p.users.name?.toLowerCase().includes(query) ||
        p.users.username?.toLowerCase().includes(query) ||
        p.users.email?.toLowerCase().includes(query)
      );
    });

  // 그룹별 멤버 수
  const getGroupMemberCount = (groupId: string) => {
    if (groupId === 'all') return participants.length;
    if (groupId === 'none') return participants.filter(p => !p.current_group).length;
    return participants.filter(p => p.current_group?.id === groupId).length;
  };

  // 프리셋 색상
  const presetColors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#06b6d4', '#3b82f6', '#64748b', '#1e293b'
  ];

  // 그룹 수정 모달 열기
  const openEditGroupModal = (group: Group) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      color_code: group.color_code || '#6366f1',
      sort_order: group.sort_order
    });
    setShowGroupModal(true);
    setShowGroupSettingsModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-900">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-gray-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">멤버 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <FiUsers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{challengeTitle}</h1>
              <p className="text-slate-500 dark:text-slate-400">멤버 관리</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          <div className="flex-1 min-w-[140px] bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-sm border border-slate-100 dark:border-gray-700 flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <FiUsers className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">전체 멤버</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white">{participants.length}</p>
            </div>
          </div>
          <div className="flex-1 min-w-[140px] bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-sm border border-slate-100 dark:border-gray-700 flex items-center gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <FiUsers className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">그룹 수</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white">{groups.length}</p>
            </div>
          </div>
          <div className="flex-1 min-w-[140px] bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-sm border border-slate-100 dark:border-gray-700 flex items-center gap-3">
            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <FiCheck className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">배정 완료</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white">{participants.filter(p => p.current_group).length}</p>
            </div>
          </div>
          <div className="flex-1 min-w-[140px] bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-sm border border-slate-100 dark:border-gray-700 flex items-center gap-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
              <FiUser className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">미배정</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white">{participants.filter(p => !p.current_group).length}</p>
            </div>
          </div>
        </div>

        {/* Group Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">그룹</h2>
              <button
                onClick={() => setShowGroupSettingsModal(true)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="그룹 설정"
              >
                <FiSettings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Group Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedGroup('all')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                selectedGroup === 'all'
                  ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-800 shadow-md'
                  : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gray-600'
              }`}
            >
              전체 <span className="ml-1 opacity-70">{getGroupMemberCount('all')}</span>
            </button>
            <button
              onClick={() => setSelectedGroup('none')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                selectedGroup === 'none'
                  ? 'bg-slate-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gray-600'
              }`}
            >
              미배정 <span className="ml-1 opacity-70">{getGroupMemberCount('none')}</span>
            </button>
            {groups.map(group => (
              <button
                key={group.id}
                onClick={() => setSelectedGroup(group.id)}
                className="px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
                style={{
                  backgroundColor: selectedGroup === group.id ? group.color_code : `${group.color_code}15`,
                  color: selectedGroup === group.id ? 'white' : group.color_code
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: selectedGroup === group.id ? 'white' : group.color_code }}
                />
                {group.name}
                <span className="opacity-70">{getGroupMemberCount(group.id)}</span>
              </button>
            ))}
          </div>

          {/* Empty Groups State */}
          {groups.length === 0 && (
            <div className="mt-4 p-6 bg-slate-50 dark:bg-gray-700 rounded-xl text-center">
              <FiUsers className="w-10 h-10 text-slate-300 dark:text-slate-500 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 mb-3">아직 생성된 그룹이 없습니다.</p>
              <button
                onClick={() => {
                  setShowGroupModal(true);
                  setEditingGroup(null);
                  setGroupForm({ name: '', color_code: '#6366f1', sort_order: 0 });
                }}
                className="text-indigo-500 font-medium hover:text-indigo-600 transition-colors"
              >
                첫 그룹 만들기 →
              </button>
            </div>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {selectedParticipants.length > 0 && (
          <div className="bg-indigo-500 rounded-2xl p-4 mb-6 flex items-center justify-between shadow-lg animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <FiCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-medium">{selectedParticipants.length}명 선택됨</span>
            </div>
            <div className="flex items-center gap-3">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    bulkAssignToGroup(e.target.value);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-white/20 text-white border-0 font-medium focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
              >
                <option value="" className="text-slate-800">그룹 선택...</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id} className="text-slate-800">{group.name}</option>
                ))}
              </select>
              <button
                onClick={() => setSelectedParticipants([])}
                className="px-4 py-2 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-colors font-medium"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* Search & Member List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden">
          {/* Search Bar */}
          <div className="p-4 border-b border-slate-100 dark:border-gray-700">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="이름, 이메일로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-gray-700 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-gray-600 dark:text-white transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-gray-700/50">
                  {groups.length > 0 && (
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedParticipants.length === filteredParticipants.length && filteredParticipants.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 dark:border-gray-600 text-indigo-500 focus:ring-indigo-500/20 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    멤버
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    그룹
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    코치 메모
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                {filteredParticipants.map((participant, index) => (
                  <tr
                    key={participant.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-gray-700/50 transition-colors group"
                    style={{ animationDelay: `${index * 20}ms` }}
                  >
                    {groups.length > 0 && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedParticipants.includes(participant.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedParticipants([...selectedParticipants, participant.id]);
                            } else {
                              setSelectedParticipants(selectedParticipants.filter(id => id !== participant.id));
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500/20 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-sm"
                          style={{
                            backgroundColor: participant.current_group?.color_code || '#64748b'
                          }}
                        >
                          {(participant.users.name || participant.users.username || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">
                            {participant.users.name || participant.users.username}
                          </p>
                          <p className="text-sm text-slate-400 dark:text-slate-500">
                            {participant.users.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {groups.length > 0 ? (
                        <div className="relative inline-block">
                          <select
                            value={participant.current_group?.id || ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                assignToGroup(participant.id, e.target.value);
                              }
                            }}
                            className="appearance-none pl-3 pr-8 py-2 rounded-lg text-sm font-medium border-0 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            style={{
                              backgroundColor: participant.current_group?.color_code
                                ? `${participant.current_group.color_code}15`
                                : '#f1f5f9',
                              color: participant.current_group?.color_code || '#64748b'
                            }}
                          >
                            <option value="" className="text-slate-800 dark:text-gray-200">미배정</option>
                            {groups.map(group => (
                              <option key={group.id} value={group.id} className="text-slate-800 dark:text-gray-200">
                                {group.name}
                              </option>
                            ))}
                          </select>
                          <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: participant.current_group?.color_code || '#64748b' }} />
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400 dark:text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingMemo === participant.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={memoText}
                            onChange={(e) => setMemoText(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 dark:text-white"
                            placeholder="메모 입력..."
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveMemo(participant.id);
                              if (e.key === 'Escape') {
                                setEditingMemo(null);
                                setMemoText('');
                              }
                            }}
                          />
                          <button
                            onClick={() => saveMemo(participant.id)}
                            disabled={savingMemo}
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                          >
                            <FiSave className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingMemo(null);
                              setMemoText('');
                            }}
                            className="p-2 bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group/memo">
                          <span className={`text-sm ${participant.coach_memo ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500 italic'}`}>
                            {participant.coach_memo || '메모 없음'}
                          </span>
                          <button
                            onClick={() => {
                              setEditingMemo(participant.id);
                              setMemoText(participant.coach_memo || '');
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all opacity-0 group-hover/memo:opacity-100"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredParticipants.length === 0 && (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiUsers className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-slate-600 dark:text-slate-300 font-medium mb-1">멤버를 찾을 수 없습니다</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm">
                {searchQuery ? '다른 검색어를 입력해보세요.' : '이 필터에 해당하는 멤버가 없습니다.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Group Settings Modal */}
      {showGroupSettingsModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowGroupSettingsModal(false);
            }
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">그룹 설정</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">그룹을 추가, 수정, 삭제합니다.</p>
              </div>
              <button
                onClick={() => setShowGroupSettingsModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Add Group Button */}
              <button
                onClick={() => {
                  setEditingGroup(null);
                  setGroupForm({ name: '', color_code: '#6366f1', sort_order: groups.length });
                  setShowGroupModal(true);
                  setShowGroupSettingsModal(false);
                }}
                className="w-full mb-4 px-4 py-3 border-2 border-dashed border-slate-200 dark:border-gray-600 rounded-xl text-slate-500 dark:text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all flex items-center justify-center gap-2 font-medium"
              >
                <FiPlus className="w-5 h-5" />
                새 그룹 추가
              </button>

              {/* Group List */}
              {groups.length > 0 ? (
                <div className="space-y-2">
                  {groups.map(group => (
                    <div
                      key={group.id}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-700 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: group.color_code }}
                        />
                        <span className="font-medium text-slate-700 dark:text-slate-200">{group.name}</span>
                        <span className="text-sm text-slate-400 dark:text-slate-500">
                          {getGroupMemberCount(group.id)}명
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditGroupModal(group)}
                          className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-white dark:hover:bg-gray-500 rounded-lg transition-colors"
                          title="수정"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteGroup(group.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-gray-500 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <FiUsers className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">생성된 그룹이 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Group Create/Edit Modal */}
      {showGroupModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowGroupModal(false);
              setEditingGroup(null);
              setGroupForm({ name: '', color_code: '#6366f1', sort_order: 0 });
            }
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 dark:border-gray-700">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                {editingGroup ? '그룹 수정' : '새 그룹 만들기'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                그룹을 만들어 멤버를 효율적으로 관리하세요.
              </p>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">그룹명</label>
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white dark:bg-gray-700 dark:text-white"
                  placeholder="예: 1조, Gold, A팀..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">색상</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {presetColors.map(color => (
                    <button
                      key={color}
                      onClick={() => setGroupForm({ ...groupForm, color_code: color })}
                      className={`w-8 h-8 rounded-lg transition-all ${
                        groupForm.color_code === color
                          ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={groupForm.color_code}
                    onChange={(e) => setGroupForm({ ...groupForm, color_code: e.target.value })}
                    className="w-12 h-10 rounded-lg border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={groupForm.color_code}
                    onChange={(e) => setGroupForm({ ...groupForm, color_code: e.target.value })}
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-600 font-mono text-sm uppercase bg-white dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">정렬 순서</label>
                <input
                  type="number"
                  value={groupForm.sort_order}
                  onChange={(e) => setGroupForm({ ...groupForm, sort_order: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white dark:bg-gray-700 dark:text-white"
                  placeholder="낮을수록 앞에 표시"
                />
              </div>

              {/* Preview */}
              <div className="p-4 bg-slate-50 dark:bg-gray-700 rounded-xl">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">미리보기</p>
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium"
                  style={{
                    backgroundColor: `${groupForm.color_code}15`,
                    color: groupForm.color_code
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: groupForm.color_code }}
                  />
                  {groupForm.name || '그룹명'}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowGroupModal(false);
                  setEditingGroup(null);
                  setGroupForm({ name: '', color_code: '#6366f1', sort_order: 0 });
                }}
                className="px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-xl transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={saveGroup}
                disabled={!groupForm.name.trim()}
                className="px-5 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-sm hover:shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingGroup ? '수정하기' : '만들기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
