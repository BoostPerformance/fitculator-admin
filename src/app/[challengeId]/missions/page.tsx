'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ChallengeMission, MissionCompletion } from '@/types/missionTypes';
import { useChallenge } from '@/components/hooks/useChallenges';
import Title from '@/components/layout/title';

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
  group?: {
    id: string;
    name: string;
    color_code: string;
    sort_order: number;
  };
}

interface Workout {
  id: string;
  user_id: string;
  start_time: string;
  title: string;
  note?: string;
  duration_minutes?: number;
  points?: number;
  type?: string;
}

export default function MissionsPage() {
  const params = useParams();
  const challengeId = params.challengeId as string;
  const { challenges } = useChallenge();
  const currentChallenge = challenges?.find((c) => c.challenges.id === challengeId);
  
  // 미션 관리 상태
  const [missions, setMissions] = useState<ChallengeMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMission, setEditingMission] = useState<ChallengeMission | null>(null);
  const [viewingMission, setViewingMission] = useState<ChallengeMission | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
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
  const [existingCompletions, setExistingCompletions] = useState<any[]>([]);

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

      // 챌린지 참가자 가져오기 (페이지네이션 없이 전체 가져오기)
      const participantsResponse = await fetch(`/api/challenge-participants?challenge_id=${challengeId}&limit=1000`);
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
        console.log('Group data:', participantsData[0].challenge_group_participants);
        console.log('Current group:', participantsData[0].current_group);
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

      // 매핑용 유저 목록도 설정 (그룹 정보 포함)
      const mappingUsersData = (Array.isArray(participantsData) ? participantsData : []).map((p: any) => {
        // current_group이 이미 있으면 사용, 없으면 직접 찾기
        let group = p.current_group || null;
        
        if (!group && p.challenge_group_participants) {
          const activeGroup = p.challenge_group_participants.find(
            (gp: any) => gp.is_active === true
          );
          group = activeGroup?.challenge_groups || null;
        }
        
        console.log(`User ${p.users?.name}: group =`, group);
        
        return {
          id: p.service_user_id,
          name: p.users?.name || '이름 없음',
          username: p.users?.username || '-',
          group: group
        };
      });
      
      // 그룹별로 정렬 (그룹 없음은 마지막)
      const sortedMappingUsers = mappingUsersData.sort((a: User, b: User) => {
        // 둘 다 그룹이 있는 경우
        if (a.group && b.group) {
          // sort_order로 정렬
          if (a.group.sort_order !== b.group.sort_order) {
            return a.group.sort_order - b.group.sort_order;
          }
          // 같은 그룹이면 이름으로 정렬
          return a.name.localeCompare(b.name);
        }
        // a만 그룹이 있는 경우
        if (a.group && !b.group) return -1;
        // b만 그룹이 있는 경우
        if (!a.group && b.group) return 1;
        // 둘 다 그룹이 없는 경우 이름으로 정렬
        return a.name.localeCompare(b.name);
      });
      
      setMappingUsers(sortedMappingUsers);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkoutsForMapping = async () => {
    if (!selectedMission || !selectedUser) {
      setWorkouts([]);
      setShowWorkouts(false);
      setExistingCompletions([]);
      return;
    }

    try {
      const mission = missions.find(m => m.id === selectedMission);
      if (!mission) {
        setWorkouts([]);
        setShowWorkouts(false);
        setExistingCompletions([]);
        return;
      }

      // 운동 데이터 가져오기
      const workoutsResponse = await fetch(
        `/api/workouts/user-workouts?userId=${selectedUser}&startDate=${mission.start_date}&endDate=${mission.end_date}`
      );
      const workoutsData = await workoutsResponse.json();
      
      // 기존 완료 데이터 가져오기
      const completionsResponse = await fetch(
        `/api/mission-completions?missionId=${selectedMission}&userId=${selectedUser}`
      );
      const completionsData = await completionsResponse.json();
      
      setWorkouts(workoutsData || []);
      setExistingCompletions(completionsData || []);
      setShowWorkouts(true);
      
      // 이미 매핑된 운동은 자동으로 선택 상태로 설정
      const mappedWorkoutIds = new Set(
        completionsData?.map((c: any) => c.workout_id).filter(Boolean) || []
      );
      setSelectedWorkouts(mappedWorkoutIds);
    } catch (error) {
      console.error('Error fetching workouts:', error);
      setWorkouts([]);
      setExistingCompletions([]);
      setShowWorkouts(true);
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
    <div className="flex-1 p-4">
      <div className="px-8 pt-4 sm:px-4 sm:pt-4">
        {currentChallenge && (
          <div className="text-0.875-400 text-gray-6 mb-2">
            {new Date(currentChallenge.challenges.start_date).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })} - {new Date(currentChallenge.challenges.end_date).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        )}
        <div className="text-gray-2 text-1.25-700 mb-2">
          {currentChallenge?.challenges.title || ''}
        </div>
        <Title title="미션" />
      </div>

      <div className="mt-6 px-8 sm:px-4 space-y-8">
        {/* 미션 관리 섹션 */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-sm text-gray-500">총 {missions.length}개의 미션</p>
            </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              미션 추가
            </button>
            <button
              onClick={() => setShowMappingModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              운동 매핑
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
                  <th className="w-10 px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="w-2/5 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제목
                  </th>
                  <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                  <th className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedMissions.map((mission, index) => (
                <tr key={mission.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                  setViewingMission(mission);
                  setShowDetailModal(true);
                }}>
                  <td className="px-2 py-4 text-center">
                    <span className="text-sm text-gray-600">{index + 1}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {mission.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="text-xs">
                      {new Date(mission.start_date).toLocaleDateString()} ~ {new Date(mission.end_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      mission.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {mission.is_active ? '활성' : '비활성'}
                    </span>
                  </td>
                </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 달성 현황 섹션 */}
      <div className="mt-2">
        <div className="mb-4">
          <h2 className="text-2xl lg:text-3xl font-bold mb-4">미션 달성 현황</h2>
          
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-gray-500">총 {users.length}명의 멤버</p>
            </div>
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
                <div className="absolute right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[300px]">
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
                <th className="w-16 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
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
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]"
                  >
                    <div className="text-xs">
                      {mission.title}
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
                      <span className="text-sm font-medium text-gray-900">{index + 1}</span>
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

        {/* 미션 상세/수정/삭제 모달 */}
        {showDetailModal && viewingMission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">미션 상세</h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setViewingMission(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* 왼쪽 컬럼 - 제목과 설명 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                    <p className="text-lg font-semibold">{viewingMission.title}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
                    <p className="text-gray-600 whitespace-pre-wrap break-words">
                      {viewingMission.description || '설명 없음'}
                    </p>
                  </div>
                </div>

                {/* 오른쪽 컬럼 - 나머지 정보 */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">미션 타입</label>
                      <p className="text-sm">
                        {viewingMission.mission_type === 'workout' ? '운동' : 
                         viewingMission.mission_type === 'diet' ? '식단' : '커스텀'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                      <p className="text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          viewingMission.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {viewingMission.is_active ? '활성' : '비활성'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                      <p className="text-sm">{new Date(viewingMission.start_date).toLocaleDateString('ko-KR')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                      <p className="text-sm">{new Date(viewingMission.end_date).toLocaleDateString('ko-KR')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">검증 필요</label>
                      <p className="text-sm">{viewingMission.requires_verification ? '필요' : '불필요'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">정렬 순서</label>
                      <p className="text-sm">{viewingMission.sort_order}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setViewingMission(null);
                    // setTimeout을 사용하여 모달이 완전히 닫힌 후 편집 모달을 열도록 함
                    setTimeout(() => {
                      handleEdit(viewingMission);
                    }, 100);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  수정
                </button>
                <button
                  onClick={() => {
                    if (confirm('정말 삭제하시겠습니까?')) {
                      handleDelete(viewingMission.id);
                      setShowDetailModal(false);
                      setViewingMission(null);
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  삭제
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setViewingMission(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 미션 추가/수정 모달 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">
                  {editingMission ? '미션 수정' : '미션 추가'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    제목 *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      미션 타입 *
                    </label>
                    <select
                      value={formData.mission_type}
                      onChange={(e) => setFormData({ ...formData, mission_type: e.target.value as 'workout' | 'diet' | 'custom' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="workout">운동</option>
                      {/* <option value="diet">식단</option> */}
                      {/* <option value="custom">커스텀</option> */}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      정렬 순서
                    </label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      시작일 *
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      종료일 *
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requires_verification"
                    checked={formData.requires_verification}
                    onChange={(e) => setFormData({ ...formData, requires_verification: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requires_verification" className="ml-2 block text-sm text-gray-900">
                    검증 필요
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
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

        {/* 운동 매핑 모달 */}
        {showMappingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">운동 매핑</h2>
                <button
                  onClick={() => {
                    setShowMappingModal(false);
                    setSelectedMission('');
                    setSelectedUser('');
                    setSelectedWorkouts(new Set());
                    setShowWorkouts(false);
                    setExistingCompletions([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      미션 선택
                    </label>
                    <select
                      value={selectedMission}
                      onChange={(e) => setSelectedMission(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">미션을 선택하세요</option>
                      {missions
                        .filter(m => m.mission_type === 'workout')
                        .sort((a, b) => {
                          // start_date 오름차순
                          const dateCompare = new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
                          if (dateCompare !== 0) return dateCompare;
                          // sort_order 오름차순
                          return a.sort_order - b.sort_order;
                        })
                        .map(mission => (
                          <option key={mission.id} value={mission.id}>
                            {mission.title} ({new Date(mission.start_date).toLocaleDateString()} ~ {new Date(mission.end_date).toLocaleDateString()})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      사용자 선택
                    </label>
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">사용자를 선택하세요</option>
                      {(() => {
                        // 그룹별로 사용자 구성
                        const groupedUsers: { [key: string]: User[] } = {};
                        const noGroupUsers: User[] = [];
                        
                        mappingUsers.forEach(user => {
                          if (user.group) {
                            const groupKey = user.group.name;
                            if (!groupedUsers[groupKey]) {
                              groupedUsers[groupKey] = [];
                            }
                            groupedUsers[groupKey].push(user);
                          } else {
                            noGroupUsers.push(user);
                          }
                        });
                        
                        // 그룹 순서대로 정렬
                        const sortedGroups = Object.keys(groupedUsers).sort((a, b) => {
                          const groupA = mappingUsers.find(u => u.group?.name === a)?.group;
                          const groupB = mappingUsers.find(u => u.group?.name === b)?.group;
                          return (groupA?.sort_order || 0) - (groupB?.sort_order || 0);
                        });
                        
                        return (
                          <>
                            {sortedGroups.map(groupName => {
                              const group = mappingUsers.find(u => u.group?.name === groupName)?.group;
                              return (
                                <optgroup 
                                  key={groupName} 
                                  label={groupName}
                                >
                                  {groupedUsers[groupName].map(user => {
                                    const userCompletions = users.find(u => u.id === user.id)?.completions || {};
                                    const missionCompletion = selectedMission ? userCompletions[selectedMission] : null;
                                    const hasCompleted = missionCompletion && 
                                      (missionCompletion.verification_status === 'approved' || 
                                       missionCompletion.verification_status === 'auto_approved');
                                    
                                    return (
                                      <option key={user.id} value={user.id}>
                                        {user.name} (@{user.username}) {hasCompleted ? '✅' : '⭕'}
                                      </option>
                                    );
                                  })}
                                </optgroup>
                              );
                            })}
                            {noGroupUsers.length > 0 && (
                              <optgroup label="그룹 미지정">
                                {noGroupUsers.map(user => {
                                  const userCompletions = users.find(u => u.id === user.id)?.completions || {};
                                  const missionCompletion = selectedMission ? userCompletions[selectedMission] : null;
                                  const hasCompleted = missionCompletion && 
                                    (missionCompletion.verification_status === 'approved' || 
                                     missionCompletion.verification_status === 'auto_approved');
                                  
                                  return (
                                    <option key={user.id} value={user.id}>
                                      {user.name} (@{user.username}) {hasCompleted ? '✅' : '⭕'}
                                    </option>
                                  );
                                })}
                              </optgroup>
                            )}
                          </>
                        );
                      })()}
                    </select>
                  </div>
                </div>

                {showWorkouts && workouts.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      운동 목록 ({workouts.length}개)
                    </h3>
                    <div className="mb-2 text-sm text-gray-600">
                      선택된 미션 기간: {
                        missions.find(m => m.id === selectedMission) &&
                        `${new Date(missions.find(m => m.id === selectedMission)!.start_date).toLocaleDateString('ko-KR')} ~ 
                         ${new Date(missions.find(m => m.id === selectedMission)!.end_date).toLocaleDateString('ko-KR')}`
                      }
                    </div>
                    <div className="border rounded-lg max-h-96 overflow-y-auto">
                      {workouts.map(workout => {
                        const isAlreadyMapped = existingCompletions.some((c: any) => c.workout_id === workout.id);
                        
                        return (
                          <label 
                            key={workout.id} 
                            className={`flex items-center p-3 cursor-pointer border-b ${
                              isAlreadyMapped ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedWorkouts.has(workout.id)}
                              onChange={(e) => {
                                const newSelected = new Set(selectedWorkouts);
                                if (e.target.checked) {
                                  newSelected.add(workout.id);
                                } else {
                                  newSelected.delete(workout.id);
                                }
                                setSelectedWorkouts(newSelected);
                              }}
                              className="mr-3"
                              disabled={isAlreadyMapped}
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{workout.title}</span>
                                  {isAlreadyMapped && (
                                    <span className="text-xs px-2 py-0.5 bg-green-600 text-white rounded">
                                      이미 등록됨
                                    </span>
                                  )}
                                </div>
                                {workout.type && (
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    workout.type === 'STRENGTH' ? 'bg-blue-100 text-blue-800' : 
                                    workout.type === 'CARDIO' ? 'bg-green-100 text-green-800' : 
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {workout.type === 'STRENGTH' ? '근력' : 
                                     workout.type === 'CARDIO' ? '유산소' : workout.type}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {new Date(workout.start_time).toLocaleString('ko-KR')}
                                {workout.duration_minutes && ` • ${workout.duration_minutes}분`}
                                {workout.points && ` • ${workout.points}점`}
                              </div>
                              {workout.note && (
                                <div className="text-sm text-gray-600 mt-1">{workout.note}</div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {showWorkouts && workouts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    해당 기간에 운동 기록이 없습니다.
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowMappingModal(false);
                      setSelectedMission('');
                      setSelectedUser('');
                      setSelectedWorkouts(new Set());
                      setShowWorkouts(false);
                      setExistingCompletions([]);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    닫기
                  </button>
                  {selectedWorkouts.size > 0 && (
                    <button
                      onClick={async () => {
                        try {
                          // 이미 매핑되지 않은 운동들만 필터링
                          const newWorkoutIds = Array.from(selectedWorkouts).filter(
                            workoutId => !existingCompletions.some((c: any) => c.workout_id === workoutId)
                          );
                          
                          if (newWorkoutIds.length === 0) {
                            alert('새로 매핑할 운동이 없습니다.');
                            return;
                          }
                          
                          // 각 운동에 대해 개별적으로 POST 요청
                          const promises = newWorkoutIds.map(workoutId => 
                            fetch('/api/mission-completions', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                mission_id: selectedMission,
                                user_id: selectedUser,
                                workout_id: workoutId,
                                verification_status: 'auto_approved'
                              })
                            })
                          );
                          
                          const results = await Promise.all(promises);
                          const successCount = results.filter(r => r.ok).length;

                          if (successCount > 0) {
                            alert(`${successCount}개의 운동이 성공적으로 매핑되었습니다.`);
                            fetchData();
                            setShowMappingModal(false);
                            setSelectedMission('');
                            setSelectedUser('');
                            setSelectedWorkouts(new Set());
                            setShowWorkouts(false);
                            setExistingCompletions([]);
                          } else {
                            alert('운동 매핑에 실패했습니다.');
                          }
                        } catch (error) {
                          console.error('Error mapping workouts:', error);
                          alert('운동 매핑 중 오류가 발생했습니다.');
                        }
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      매핑하기 ({Array.from(selectedWorkouts).filter(
                        workoutId => !existingCompletions.some((c: any) => c.workout_id === workoutId)
                      ).length}개 신규)
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}