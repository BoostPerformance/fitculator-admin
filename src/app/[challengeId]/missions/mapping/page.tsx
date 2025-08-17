'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ChallengeMission, MissionCompletion } from '@/types/missionTypes';

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

export default function MissionMappingPage() {
  const params = useParams();
  const challengeId = params.challengeId as string;
  const [missions, setMissions] = useState<ChallengeMission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [completions, setCompletions] = useState<MissionCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 선택 상태
  const [selectedMission, setSelectedMission] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedWorkouts, setSelectedWorkouts] = useState<Set<string>>(new Set());
  const [showWorkouts, setShowWorkouts] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [challengeId]);

  useEffect(() => {
    if (selectedMission && selectedUser) {
      fetchWorkouts();
      fetchExistingMappings();
    }
  }, [selectedMission, selectedUser]);

  const fetchInitialData = async () => {
    try {
      // 미션 목록 가져오기
      const missionsResponse = await fetch(`/api/missions?challengeId=${challengeId}`);
      const missionsData = await missionsResponse.json();
      setMissions(missionsData.filter((m: ChallengeMission) => m.mission_type === 'workout'));

      // 참가자 목록 가져오기
      const participantsResponse = await fetch(`/api/challenge-participants?challengeId=${challengeId}`);
      const participantsData = await participantsResponse.json();
      const usersData = participantsData.map((p: any) => ({
        id: p.service_user_id,
        name: p.service_user?.name || '이름 없음',
        username: p.service_user?.username || '유저명 없음'
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkouts = async () => {
    if (!selectedMission || !selectedUser) return;

    try {
      const mission = missions.find(m => m.id === selectedMission);
      if (!mission) return;

      // 선택된 미션의 기간 내 운동 가져오기
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

  const fetchExistingMappings = async () => {
    try {
      const response = await fetch(
        `/api/mission-completions?missionId=${selectedMission}&userId=${selectedUser}`
      );
      const data = await response.json();
      setCompletions(data);
      
      // 이미 매핑된 운동 선택 상태로 설정
      const mappedWorkouts = new Set<string>();
      data.forEach((completion: MissionCompletion) => {
        if (completion.workout_id) {
          mappedWorkouts.add(completion.workout_id);
        }
      });
      setSelectedWorkouts(mappedWorkouts);
    } catch (error) {
      console.error('Error fetching existing mappings:', error);
    }
  };

  const handleWorkoutToggle = (workoutId: string) => {
    const newSelected = new Set(selectedWorkouts);
    if (newSelected.has(workoutId)) {
      newSelected.delete(workoutId);
    } else {
      newSelected.add(workoutId);
    }
    setSelectedWorkouts(newSelected);
  };

  const handleSaveMapping = async () => {
    if (!selectedMission || !selectedUser) {
      alert('미션과 유저를 선택해주세요.');
      return;
    }

    try {
      // 기존 매핑 삭제
      const existingCompletions = completions.filter(c => 
        c.mission_id === selectedMission && c.user_id === selectedUser
      );
      
      for (const completion of existingCompletions) {
        await fetch(`/api/mission-completions?completionId=${completion.id}`, {
          method: 'DELETE'
        });
      }

      // 새로운 매핑 생성
      for (const workoutId of selectedWorkouts) {
        await fetch('/api/mission-completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mission_id: selectedMission,
            user_id: selectedUser,
            workout_id: workoutId,
            proof_note: '관리자가 수동으로 매핑함'
          })
        });
      }

      alert('매핑이 저장되었습니다.');
      fetchExistingMappings();
    } catch (error) {
      console.error('Error saving mapping:', error);
      alert('매핑 저장 중 오류가 발생했습니다.');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">로딩 중...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">미션-운동 매핑</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1단계: 미션 선택 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">1. 미션 선택</h2>
          <select
            value={selectedMission}
            onChange={(e) => {
              setSelectedMission(e.target.value);
              setSelectedUser('');
              setSelectedWorkouts(new Set());
              setShowWorkouts(false);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">미션을 선택하세요</option>
            {missions.map((mission) => (
              <option key={mission.id} value={mission.id}>
                {mission.title} ({new Date(mission.start_date).toLocaleDateString()} - {new Date(mission.end_date).toLocaleDateString()})
              </option>
            ))}
          </select>
          
          {selectedMission && (
            <div className="mt-4 p-3 bg-blue-50 rounded">
              <p className="text-sm text-blue-800">
                {missions.find(m => m.id === selectedMission)?.description || '설명이 없습니다.'}
              </p>
            </div>
          )}
        </div>

        {/* 2단계: 유저 선택 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">2. 유저 선택</h2>
          <select
            value={selectedUser}
            onChange={(e) => {
              setSelectedUser(e.target.value);
              setSelectedWorkouts(new Set());
            }}
            disabled={!selectedMission}
            className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
          >
            <option value="">유저를 선택하세요</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} (@{user.username})
              </option>
            ))}
          </select>
        </div>

        {/* 3단계: 저장 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">3. 매핑 저장</h2>
          <div className="space-y-2 mb-4">
            <p className="text-sm text-gray-600">
              선택된 미션: {missions.find(m => m.id === selectedMission)?.title || '-'}
            </p>
            <p className="text-sm text-gray-600">
              선택된 유저: {users.find(u => u.id === selectedUser)?.name || '-'}
            </p>
            <p className="text-sm text-gray-600">
              선택된 운동: {selectedWorkouts.size}개
            </p>
          </div>
          <button
            onClick={handleSaveMapping}
            disabled={!selectedMission || !selectedUser}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            매핑 저장
          </button>
        </div>
      </div>

      {/* 운동 목록 */}
      {showWorkouts && (
        <div className="mt-6 bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">운동 선택</h2>
            {workouts.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {workouts.map((workout) => (
                  <div
                    key={workout.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedWorkouts.has(workout.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleWorkoutToggle(workout.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedWorkouts.has(workout.id)}
                            onChange={() => {}}
                            className="mr-2"
                          />
                          <span className="font-medium">{workout.title}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDateTime(workout.start_time)}
                        </p>
                        {workout.note && (
                          <p className="text-sm text-gray-500 mt-1">{workout.note}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                해당 기간에 운동 기록이 없습니다.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}