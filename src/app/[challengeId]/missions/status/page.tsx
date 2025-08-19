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

export default function MissionStatusPage() {
  const params = useParams();
  const challengeId = params.challengeId as string;
  const [missions, setMissions] = useState<ChallengeMission[]>([]);
  const [users, setUsers] = useState<UserWithCompletions[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, [challengeId]);

  const fetchData = async () => {
    try {
      // 미션 가져오기
      const missionsResponse = await fetch(`/api/missions?challengeId=${challengeId}`);
      const missionsData = await missionsResponse.json();
      setMissions(missionsData);

      // 챌린지 참가자 가져오기
      const participantsResponse = await fetch(`/api/challenge-participants?challengeId=${challengeId}`);
      const participantsData = await participantsResponse.json();

      // 미션 완료 정보 가져오기
      const completionsResponse = await fetch(`/api/mission-completions?challengeId=${challengeId}`);
      const completionsData = await completionsResponse.json();

      // 유저별로 완료 정보 매핑
      const usersWithCompletions = participantsData.map((participant: any) => {
        const userCompletions: { [missionId: string]: MissionCompletion } = {};
        completionsData.forEach((completion: MissionCompletion) => {
          if (completion.user_id === participant.service_user_id) {
            userCompletions[completion.mission_id] = completion;
          }
        });
        return {
          id: participant.service_user_id,
          name: participant.service_user?.name || '이름 없음',
          username: participant.service_user?.username || '유저명 없음',
          completions: userCompletions
        };
      });

      setUsers(usersWithCompletions);
    } catch (error) {
// console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const calculateCompletionRate = (user: UserWithCompletions) => {
    const totalMissions = missions.length;
    if (totalMissions === 0) return 0;
    
    const completedMissions = Object.values(user.completions).filter(
      c => c.verification_status === 'approved' || c.verification_status === 'auto_approved'
    ).length;
    
    return Math.round((completedMissions / totalMissions) * 100);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">로딩 중...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">미션 달성 현황</h1>
        
        <div className="flex gap-4 mb-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">전체</option>
            <option value="completed">완료</option>
            <option value="pending">검증 대기</option>
            <option value="incomplete">미완료</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="sticky left-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                멤버
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                달성률
              </th>
              {missions.map((mission) => (
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
            {users.map((user) => {
              const completionRate = calculateCompletionRate(user);
              
              return (
                <tr key={user.id}>
                  <td className="sticky left-0 bg-white px-6 py-4 whitespace-nowrap">
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
                  {missions.map((mission) => (
                    <td key={mission.id} className="px-6 py-4 whitespace-nowrap text-center">
                      {getStatusBadge(user.completions[mission.id])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          참가자가 없습니다.
        </div>
      )}
    </div>
  );
}