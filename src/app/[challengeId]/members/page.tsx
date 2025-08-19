'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FiEdit2, FiSave, FiX, FiPlus, FiTrash2, FiUsers } from 'react-icons/fi';

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
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupForm, setGroupForm] = useState({ name: '', color_code: '#FFD700', sort_order: 0 });
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [bulkGroupAssign, setBulkGroupAssign] = useState(false);
  const [challengeTitle, setChallengeTitle] = useState('');

  // 참가자 목록 가져오기
  const fetchParticipants = async () => {
    try {
      const res = await fetch(`/api/challenge-participants?challenge_id=${challengeId}&limit=100`);
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
        setGroupForm({ name: '', color_code: '#FFD700', sort_order: 0 });
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
    setBulkGroupAssign(false);
  };

  // 필터링된 참가자 목록
  const filteredParticipants = selectedGroup === 'all' 
    ? participants
    : selectedGroup === 'none'
    ? participants.filter(p => !p.current_group)
    : participants.filter(p => p.current_group?.id === selectedGroup);

  if (loading) return <div className="flex items-center justify-center min-h-screen">로딩 중...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{challengeTitle} - 멤버 관리</h1>
        <p className="text-gray-600">참가자 목록과 그룹을 관리합니다.</p>
      </div>

      {/* 그룹 관리 섹션 */}
      {groups.length > 0 || showGroupModal ? (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">그룹 관리</h2>
            <button
              onClick={() => {
                setShowGroupModal(true);
                setEditingGroup(null);
                setGroupForm({ name: '', color_code: '#FFD700', sort_order: groups.length });
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
            >
              <FiPlus /> 그룹 추가
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedGroup('all')}
              className={`px-4 py-2 rounded ${selectedGroup === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              전체 ({participants.length})
            </button>
            <button
              onClick={() => setSelectedGroup('none')}
              className={`px-4 py-2 rounded ${selectedGroup === 'none' ? 'bg-gray-500 text-white' : 'bg-gray-200'}`}
            >
              미배정 ({participants.filter(p => !p.current_group).length})
            </button>
            {groups.map(group => (
              <div key={group.id} className="flex items-center">
                <button
                  onClick={() => setSelectedGroup(group.id)}
                  className={`px-4 py-2 rounded-l ${selectedGroup === group.id ? 'text-white' : 'bg-gray-200'}`}
                  style={{
                    backgroundColor: selectedGroup === group.id ? group.color_code : undefined
                  }}
                >
                  {group.name} ({participants.filter(p => p.current_group?.id === group.id).length})
                </button>
                <button
                  onClick={() => {
                    setEditingGroup(group);
                    setGroupForm({
                      name: group.name,
                      color_code: group.color_code || '#FFD700',
                      sort_order: group.sort_order
                    });
                    setShowGroupModal(true);
                  }}
                  className="px-2 py-2 bg-gray-300 hover:bg-gray-400"
                >
                  <FiEdit2 size={16} />
                </button>
                <button
                  onClick={() => deleteGroup(group.id)}
                  className="px-2 py-2 bg-red-500 text-white rounded-r hover:bg-red-600"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {selectedParticipants.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded">
              <span>{selectedParticipants.length}명 선택됨</span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    bulkAssignToGroup(e.target.value);
                  }
                }}
                className="px-3 py-1 border rounded"
              >
                <option value="">그룹 선택...</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
              <button
                onClick={() => setSelectedParticipants([])}
                className="px-3 py-1 bg-gray-500 text-white rounded"
              >
                선택 취소
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-8 bg-gray-50 rounded-lg p-6 text-center">
          <FiUsers className="mx-auto text-4xl text-gray-400 mb-2" />
          <p className="text-gray-600 mb-4">아직 생성된 그룹이 없습니다.</p>
          <button
            onClick={() => {
              setShowGroupModal(true);
              setGroupForm({ name: '', color_code: '#FFD700', sort_order: 0 });
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            첫 그룹 만들기
          </button>
        </div>
      )}

      {/* 참가자 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              {groups.length > 0 && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  선택
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                이름
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                이메일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                그룹
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                코치메모
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                액션
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredParticipants.map((participant) => (
              <tr key={participant.id}>
                {groups.length > 0 && (
                  <td className="px-6 py-4 whitespace-nowrap">
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
                    />
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {participant.users.name || participant.users.username}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{participant.users.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {groups.length > 0 ? (
                    <select
                      value={participant.current_group?.id || ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          assignToGroup(participant.id, e.target.value);
                        }
                      }}
                      className="text-sm border rounded px-2 py-1"
                      style={{
                        backgroundColor: participant.current_group?.color_code 
                          ? `${participant.current_group.color_code}20` 
                          : undefined
                      }}
                    >
                      <option value="">미배정</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingMemo === participant.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={memoText}
                        onChange={(e) => setMemoText(e.target.value)}
                        className="text-sm border rounded px-2 py-1 flex-1"
                        placeholder="메모 입력..."
                      />
                      <button
                        onClick={() => saveMemo(participant.id)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <FiSave />
                      </button>
                      <button
                        onClick={() => {
                          setEditingMemo(null);
                          setMemoText('');
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FiX />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {participant.coach_memo || '-'}
                      </span>
                      <button
                        onClick={() => {
                          setEditingMemo(participant.id);
                          setMemoText(participant.coach_memo || '');
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FiEdit2 size={14} />
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button className="text-blue-600 hover:text-blue-800">
                    상세보기
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 그룹 생성/수정 모달 */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">
              {editingGroup ? '그룹 수정' : '새 그룹 만들기'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">그룹명</label>
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="예: 1조, Gold, A그룹..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">색상</label>
                <input
                  type="color"
                  value={groupForm.color_code}
                  onChange={(e) => setGroupForm({ ...groupForm, color_code: e.target.value })}
                  className="w-full h-10 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">정렬 순서</label>
                <input
                  type="number"
                  value={groupForm.sort_order}
                  onChange={(e) => setGroupForm({ ...groupForm, sort_order: Number(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="낮을수록 앞에 표시"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowGroupModal(false);
                  setEditingGroup(null);
                  setGroupForm({ name: '', color_code: '#FFD700', sort_order: 0 });
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                취소
              </button>
              <button
                onClick={saveGroup}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {editingGroup ? '수정' : '생성'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}