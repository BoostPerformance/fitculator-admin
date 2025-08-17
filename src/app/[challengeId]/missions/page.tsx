'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ChallengeMission, MissionCompletion } from '@/types/missionTypes';

interface UserWithCompletions {
  id: string;
  name: string;
  username: string;
  completions: { [missionId: string]: MissionCompletion };
}

interface User {
  id: string;
  name: string;
  username: string;
}

interface Workout {
  id: string;
  user_id: string;
  start_time: string;
  title: string;
  note?: string;
}

export default function MissionsPage() {
  const params = useParams();
  const challengeId = params.challengeId as string;
  
  // 미션 관리 상태
  const [missions, setMissions] = useState<ChallengeMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMission, setEditingMission] = useState<ChallengeMission | null>(null);
  const [viewingMission, setViewingMission] = useState<ChallengeMission | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mission_type: 'workout' as 'workout' | 'diet' | 'custom',
    start_date: '',
    end_date: '',
    requires_verification: false,
    sort_order: 0
  });

  // 달성 현황 상태
  const [users, setUsers] = useState<UserWithCompletions[]>([]);
  const [memberSortField, setMemberSortField] = useState<'name' | 'completion_rate'>('name');
  const [memberSortOrder, setMemberSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedMissionIds, setSelectedMissionIds] = useState<Set<string>>(new Set());
  const [showMissionFilter, setShowMissionFilter] = useState(false);

  // 매핑 모달 상태
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [mappingUsers, setMappingUsers] = useState<User[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedMission, setSelectedMission] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedWorkouts, setSelectedWorkouts] = useState<Set<string>>(new Set());
  const [showWorkouts, setShowWorkouts] = useState(false);

  useEffect(() => {
    fetchData();
  }, [challengeId]);

  // 활성 미션만 기본 선택
  useEffect(() => {
    const activeMissions = missions.filter(m => m.is_active);
    setSelectedMissionIds(new Set(activeMissions.map(m => m.id)));
  }, [missions]);

  useEffect(() => {
    if (selectedMission && selectedUser) {
      fetchWorkoutsForMapping();
    }
  }, [selectedMission, selectedUser]);

  // 정렬된 미션 목록
  const sortedMissions = [...missions].sort((a, b) => {
    const dateA = new Date(a.start_date).getTime();
    const dateB = new Date(b.start_date).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const handleSortToggle = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  // 선택된 미션들 (컬럼 순서: start_date 빠른순서, sort_order 작은 순서)
  const filteredMissions = missions
    .filter(m => selectedMissionIds.has(m.id))
    .sort((a, b) => {
      // start_date 빠른 순서 (asc)
      const dateCompare = new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      if (dateCompare !== 0) {
        return dateCompare;
      }
      // sort_order 작은 순서 (asc)
      return a.sort_order - b.sort_order;
    });

  // 달성률 계산 함수 (선택된 미션 기준)
  const calculateCompletionRate = (user: UserWithCompletions) => {
    const totalMissions = filteredMissions.length;
    if (totalMissions === 0) return 0;
    
    const completedMissions = filteredMissions.filter(mission => {
      const completion = user.completions[mission.id];
      return completion && (completion.verification_status === 'approved' || completion.verification_status === 'auto_approved');
    }).length;
    
    return Math.round((completedMissions / totalMissions) * 100);
  };

  // 정렬된 사용자 목록
  const sortedUsers = [...users].sort((a, b) => {
    if (memberSortField === 'name') {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return memberSortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    } else {
      const rateA = calculateCompletionRate(a);
      const rateB = calculateCompletionRate(b);
      return memberSortOrder === 'asc' ? rateA - rateB : rateB - rateA;
    }
  });

  const handleMemberSortToggle = (field: 'name' | 'completion_rate') => {
    if (memberSortField === field) {
      setMemberSortOrder(memberSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setMemberSortField(field);
      setMemberSortOrder('asc');
    }
  };

  const fetchData = async () => {
    try {
      // 미션 가져오기
      const missionsResponse = await fetch(`/api/missions?challengeId=${challengeId}`);
      const missionsData = await missionsResponse.json();
      setMissions(missionsData || []);

      // 챌린지 참가자 가져오기
      const participantsResponse = await fetch(`/api/challenge-participants?challenge_id=${challengeId}`);
      const participantsResult = await participantsResponse.json();
      console.log('Participants response status:', participantsResponse.status);
      console.log('Participants result:', participantsResult);
      
      // API 응답 구조에 따라 data 추출
      const participantsData = participantsResult.data || [];
      console.log('Extracted participants data:', participantsData);
      console.log('Is array?', Array.isArray(participantsData));
      
      if (participantsData.length > 0) {
        console.log('First participant structure:', participantsData[0]);
        console.log('Users data:', participantsData[0].users);
      }

      // 미션 완료 정보 가져오기
      const completionsResponse = await fetch(`/api/mission-completions?challengeId=${challengeId}`);
      const completionsData = await completionsResponse.json();
      console.log('Completions data:', completionsData);

      // 유저별로 완료 정보 매핑
      const usersWithCompletions = (Array.isArray(participantsData) ? participantsData : []).map((participant: any) => {
        const userCompletions: { [missionId: string]: MissionCompletion } = {};
        (Array.isArray(completionsData) ? completionsData : []).forEach((completion: MissionCompletion) => {
          if (completion.user_id === participant.service_user_id) {
            userCompletions[completion.mission_id] = completion;
          }
        });
        return {
          id: participant.service_user_id,
          name: participant.users?.name || '이름 없음',
          username: participant.users?.username || '-',
          completions: userCompletions
        };
      });

      setUsers(usersWithCompletions);

      // 매핑용 유저 목록도 설정
      const mappingUsersData = (Array.isArray(participantsData) ? participantsData : []).map((p: any) => ({
        id: p.service_user_id,
        name: p.users?.name || '이름 없음',
        username: p.users?.username || '-'
      }));
      setMappingUsers(mappingUsersData);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkoutsForMapping = async () => {
    if (!selectedMission || !selectedUser) return;

    try {
      const mission = missions.find(m => m.id === selectedMission);
      if (!mission) return;

      const response = await fetch(
        `/api/workouts/user-detail?userId=${selectedUser}&startDate=${mission.start_date}&endDate=${mission.end_date}`
      );
      const data = await response.json();
      setWorkouts(data);
      setShowWorkouts(true);
    } catch (error) {
      console.error('Error fetching workouts:', error);
    }
  };

  // 미션 관리 함수들
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = '/api/missions';
      const method = editingMission ? 'PUT' : 'POST';
      const body = editingMission 
        ? { id: editingMission.id, ...formData }
        : { challenge_id: challengeId, ...formData };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        fetchData();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving mission:', error);
    }
  };

  const handleDelete = async (missionId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/missions?missionId=${missionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting mission:', error);
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
    setShowAddModal(false);
  };


  // 상태 배지
  const getStatusBadge = (completion?: MissionCompletion) => {
    if (!completion) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">미완료</span>;
    }

    switch (completion.verification_status) {
      case 'approved':
      case 'auto_approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">완료</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">검증 대기</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">거부됨</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">미완료</span>;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">로딩 중...</div>;
  }

  return (
    <div className="p-6 space-y-8">
      {/* 미션 관리 섹션 */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">미션 관리</h1>
            <p className="text-sm text-gray-500 mt-1">총 {missions.length}개의 미션</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowMappingModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              운동 매핑
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              미션 추가
            </button>
          </div>
        </div>

        {/* 미션 테이블 */}
        <div className="bg-white rounded-lg shadow overflow-x-auto mb-8">
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
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="text-xs">
                      {new Date(mission.start_date).toLocaleDateString()}
                      <br />
                      ~{new Date(mission.end_date).toLocaleDateString()}
                    </div>
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
      </div>

      {/* 달성 현황 섹션 */}
      <div>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold">미션 달성 현황</h2>
              <p className="text-sm text-gray-500 mt-1">총 {users.length}명의 멤버</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <div className="relative">
              <button
                onClick={() => setShowMissionFilter(!showMissionFilter)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-2"
              >
                미션 필터 ({selectedMissionIds.size}/{missions.length})
                <svg className={`w-4 h-4 transition-transform ${showMissionFilter ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showMissionFilter && (
                <div className="absolute right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[200px]">
                  <div className="p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">미션 선택</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            const activeMissions = missions.filter(m => m.is_active);
                            setSelectedMissionIds(new Set(activeMissions.map(m => m.id)));
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          활성만
                        </button>
                        <span className="text-xs text-gray-400">|</span>
                        <button
                          onClick={() => setSelectedMissionIds(new Set(missions.map(m => m.id)))}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          전체
                        </button>
                        <span className="text-xs text-gray-400">|</span>
                        <button
                          onClick={() => setSelectedMissionIds(new Set())}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          초기화
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {[...missions]
                        .sort((a, b) => {
                          // start_date 늦은 순서 (desc)
                          const dateCompare = new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
                          if (dateCompare !== 0) {
                            return dateCompare;
                          }
                          // sort_order 큰 순서 (desc)
                          return b.sort_order - a.sort_order;
                        })
                        .map((mission) => (
                        <label key={mission.id} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={selectedMissionIds.has(mission.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedMissionIds);
                              if (e.target.checked) {
                                newSelected.add(mission.id);
                              } else {
                                newSelected.delete(mission.id);
                              }
                              setSelectedMissionIds(newSelected);
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className={`${mission.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
                            {mission.title}
                            {!mission.is_active && <span className="text-xs text-gray-400 ml-1">(비활성)</span>}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-16 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="sticky left-16 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleMemberSortToggle('name')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    멤버
                    <svg className={`w-4 h-4 transition-transform ${
                      memberSortField === 'name' ? (memberSortOrder === 'desc' ? 'rotate-180' : '') : 'opacity-50'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleMemberSortToggle('completion_rate')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    달성률
                    <svg className={`w-4 h-4 transition-transform ${
                      memberSortField === 'completion_rate' ? (memberSortOrder === 'desc' ? 'rotate-180' : '') : 'opacity-50'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                </th>
                {filteredMissions.map((mission) => (
                  <th
                    key={mission.id}
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold">{mission.title}</span>
                      <span className="text-xs text-gray-400">
                        {mission.mission_type === 'workout' ? '운동' : mission.mission_type === 'diet' ? '식단' : '커스텀'}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedUsers.map((user, index) => {
                const completionRate = calculateCompletionRate(user);
                
                return (
                  <tr key={user.id}>
                    <td className="w-16 px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                    </td>
                    <td className="sticky left-16 bg-white px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 mr-2">
                          <div className="bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${completionRate}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{completionRate}%</span>
                      </div>
                    </td>
                    {filteredMissions.map((mission) => (
                      <td key={mission.id} className="px-6 py-4 whitespace-nowrap text-center">
                        {getStatusBadge(user.completions[mission.id])}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              참가자가 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* 여기에 모달들 추가 예정 */}
    </div>
  );
}