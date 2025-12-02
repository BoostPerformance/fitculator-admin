'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ChallengeMission, ChallengeGroup } from '@/types/missionTypes';

export default function MissionManagePage() {
  const params = useParams();
  const challengeId = params.challengeId as string;
  const [missions, setMissions] = useState<ChallengeMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMission, setEditingMission] = useState<ChallengeMission | null>(null);
  const [viewingMission, setViewingMission] = useState<ChallengeMission | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [challengeGroups, setChallengeGroups] = useState<ChallengeGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mission_type: 'workout' as 'workout' | 'diet' | 'custom',
    start_date: '',
    end_date: '',
    requires_verification: false,
    sort_order: 0
  });

  useEffect(() => {
    fetchMissions();
    fetchChallengeGroups();
  }, [challengeId]);

  const fetchChallengeGroups = async () => {
    try {
      const response = await fetch(`/api/challenge-groups?challenge_id=${challengeId}`);
      const result = await response.json();
      const groups = result.data || result;
      if (Array.isArray(groups)) {
        setChallengeGroups(groups.sort((a: ChallengeGroup, b: ChallengeGroup) => a.sort_order - b.sort_order));
      }
    } catch (error) {
      console.error('Error fetching challenge groups:', error);
    }
  };

  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroupIds(prev => {
      if (prev.includes(groupId)) {
        // 최소 1개는 선택되어 있어야 함
        if (prev.length === 1) {
          return prev;
        }
        return prev.filter(id => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };

  // 정렬된 미션 목록
  const sortedMissions = [...missions].sort((a, b) => {
    const dateA = new Date(a.start_date).getTime();
    const dateB = new Date(b.start_date).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const handleSortToggle = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  const fetchMissions = async () => {
    try {
      const response = await fetch(`/api/missions?challengeId=${challengeId}`);
// console.log('Fetching missions for challenge:', challengeId);
      
      if (!response.ok) {
// console.error('Failed to fetch missions:', response.status, response.statusText);
        const errorData = await response.json();
// console.error('Error details:', errorData);
      } else {
        const data = await response.json();
// console.log('Missions fetched:', data);
        setMissions(data || []);
      }
    } catch (error) {
// console.error('Error fetching missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 날짜 유효성 검사
    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      alert('종료일은 시작일 이후여야 합니다.');
      return;
    }

    try {
      const url = '/api/missions';
      const method = editingMission ? 'PUT' : 'POST';
      const body = editingMission
        ? { id: editingMission.id, ...formData, target_group_ids: selectedGroupIds.length > 0 ? selectedGroupIds : null }
        : { challenge_id: challengeId, ...formData, target_group_ids: selectedGroupIds.length > 0 ? selectedGroupIds : null };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        fetchMissions();
        resetForm();
      }
    } catch (error) {
// console.error('Error saving mission:', error);
    }
  };

  const handleDelete = async (missionId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/missions?missionId=${missionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchMissions();
      }
    } catch (error) {
// console.error('Error deleting mission:', error);
    }
  };

  const handleEdit = (mission: ChallengeMission) => {
    setEditingMission(mission);
    setFormData({
      title: mission.title,
      description: mission.description || '',
      mission_type: mission.mission_type,
      start_date: mission.start_date,
      end_date: mission.end_date,
      requires_verification: mission.requires_verification,
      sort_order: mission.sort_order
    });
    // 기존 타겟 그룹 설정
    if (mission.challenge_mission_target_groups && mission.challenge_mission_target_groups.length > 0) {
      setSelectedGroupIds(mission.challenge_mission_target_groups.map(tg => tg.group_id));
    } else {
      setSelectedGroupIds([]);
    }
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      mission_type: 'workout',
      start_date: '',
      end_date: '',
      requires_verification: false,
      sort_order: 0
    });
    setEditingMission(null);
    setSelectedGroupIds([]);
    setShowAddModal(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">로딩 중...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">미션 관리</h1>
          <p className="text-sm text-gray-500 mt-1">총 {missions.length}개의 미션</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          미션 추가
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {missions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">등록된 미션이 없습니다.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              첫 미션 추가하기
            </button>
          </div>
        ) : (
          <table className="w-full table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-2/5 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  제목
                </th>
                {/* <th className="w-1/12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  타입
                </th> */}
                <th className="w-1/5 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={handleSortToggle}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    기간
                    <svg className={`w-4 h-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                </th>
                {/* <th className="w-1/12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  검증
                </th> */}
                <th className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  대상
                </th>
                <th className="w-1/12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedMissions.map((mission, index) => (
              <tr key={mission.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setViewingMission(mission)}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    <span className="text-gray-400 text-xs mr-2">#{index + 1}</span>
                    {mission.title}
                  </div>
                </td>
                {/* <td className="px-6 py-4">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {mission.mission_type}
                  </span>
                </td> */}
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="text-xs">
                    {new Date(mission.start_date).toLocaleDateString()}
                    <br />
                    ~{new Date(mission.end_date).toLocaleDateString()}
                  </div>
                </td>
                {/* <td className="px-6 py-4">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    mission.requires_verification ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {mission.requires_verification ? '필요' : '불필요'}
                  </span>
                </td> */}
                <td className="px-6 py-4">
                  {(!mission.challenge_mission_target_groups || mission.challenge_mission_target_groups.length === 0) ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      전체
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {mission.challenge_mission_target_groups.map((tg) => {
                        const group = challengeGroups.find(g => g.id === tg.group_id);
                        return (
                          <span
                            key={tg.group_id}
                            className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800"
                            style={{
                              borderLeft: group?.color_code ? `3px solid ${group.color_code}` : undefined
                            }}
                          >
                            {group?.name || '알 수 없음'}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    mission.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {mission.is_active ? '활성' : '비활성'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(mission);
                      }}
                      className="text-indigo-600 hover:text-indigo-900 text-xs"
                    >
                      수정
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(mission.id);
                      }}
                      className="text-red-600 hover:text-red-900 text-xs"
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingMission ? '미션 수정' : '미션 추가'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  미션 타입
                </label>
                <select
                  value={formData.mission_type}
                  onChange={(e) => setFormData({ ...formData, mission_type: e.target.value as 'workout' | 'diet' | 'custom' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="workout">운동</option>
                  <option value="diet">식단</option>
                  <option value="custom">커스텀</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    시작일
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    종료일
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.requires_verification}
                    onChange={(e) => setFormData({ ...formData, requires_verification: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">검증 필요</span>
                </label>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  정렬 순서
                </label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* 타겟 그룹 선택 */}
              {challengeGroups.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    대상 그룹
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={selectedGroupIds.length === 0}
                        onChange={() => setSelectedGroupIds([])}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">전체 (모든 그룹)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={selectedGroupIds.length > 0}
                        onChange={() => {
                          if (selectedGroupIds.length === 0 && challengeGroups.length > 0) {
                            setSelectedGroupIds([challengeGroups[0].id]);
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">특정 그룹 선택</span>
                    </label>
                    {selectedGroupIds.length > 0 && (
                      <div className="ml-6 mt-2 space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
                        {challengeGroups.map((group) => (
                          <label key={group.id} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedGroupIds.includes(group.id)}
                              onChange={() => toggleGroupSelection(group.id)}
                              className="mr-2"
                            />
                            <span
                              className="text-sm"
                              style={{
                                borderLeft: group.color_code ? `3px solid ${group.color_code}` : undefined,
                                paddingLeft: group.color_code ? '8px' : undefined
                              }}
                            >
                              {group.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                    {selectedGroupIds.length > 0 && (
                      <p className="text-xs text-blue-600 ml-6">
                        {selectedGroupIds.length}개 그룹에만 미션이 적용됩니다
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingMission ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 상세 보기 모달 */}
      {viewingMission && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">미션 상세 정보</h2>
              <button
                onClick={() => setViewingMission(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                <p className="text-lg font-semibold text-gray-900">{viewingMission.title}</p>
              </div>
              
              {viewingMission.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <p className="text-gray-700 whitespace-pre-wrap">{viewingMission.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">미션 타입</label>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {viewingMission.mission_type === 'workout' ? '운동' : 
                     viewingMission.mission_type === 'diet' ? '식단' : '커스텀'}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">정렬 순서</label>
                  <p className="text-gray-700">{viewingMission.sort_order}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                  <p className="text-gray-700">{new Date(viewingMission.start_date).toLocaleDateString()}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                  <p className="text-gray-700">{new Date(viewingMission.end_date).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">검증 필요</label>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    viewingMission.requires_verification ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {viewingMission.requires_verification ? '필요' : '불필요'}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    viewingMission.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {viewingMission.is_active ? '활성' : '비활성'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">생성일</label>
                  <p className="text-gray-700">{new Date(viewingMission.created_at).toLocaleString()}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">수정일</label>
                  <p className="text-gray-700">{new Date(viewingMission.updated_at).toLocaleString()}</p>
                </div>
              </div>

              {/* 대상 그룹 표시 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">대상 그룹</label>
                {(!viewingMission.challenge_mission_target_groups || viewingMission.challenge_mission_target_groups.length === 0) ? (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                    전체 (모든 그룹)
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {viewingMission.challenge_mission_target_groups.map((tg) => {
                      const group = challengeGroups.find(g => g.id === tg.group_id);
                      return (
                        <span
                          key={tg.group_id}
                          className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"
                          style={{
                            borderLeft: group?.color_code ? `3px solid ${group.color_code}` : undefined,
                            paddingLeft: group?.color_code ? '8px' : undefined
                          }}
                        >
                          {group?.name || '알 수 없음'}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setViewingMission(null);
                  handleEdit(viewingMission);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                수정
              </button>
              <button
                onClick={() => setViewingMission(null)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}