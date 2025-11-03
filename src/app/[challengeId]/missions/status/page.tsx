'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ChallengeMission, MissionCompletion } from '@/types/missionTypes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

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
      return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300 text-xs px-2.5 py-0.5 sm:text-[10px] sm:px-1.5 sm:py-0">미완료</Badge>;
    }

    switch (completion.verification_status) {
      case 'approved':
      case 'auto_approved':
        return <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-100 text-xs px-2.5 py-0.5 sm:text-[10px] sm:px-1.5 sm:py-0">완료</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs px-2.5 py-0.5 sm:text-[10px] sm:px-1.5 sm:py-0"><span className="sm:hidden">검증 대기</span><span className="hidden sm:inline">대기중</span></Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300 text-xs px-2.5 py-0.5 sm:text-[10px] sm:px-1.5 sm:py-0"><span className="sm:hidden">거부됨</span><span className="hidden sm:inline">거부</span></Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300 text-xs px-2.5 py-0.5 sm:text-[10px] sm:px-1.5 sm:py-0">미완료</Badge>;
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
    <div className="p-3 md:p-6">
      <div className="mb-4 md:mb-6">
        <h1 className="text-lg md:text-2xl font-bold mb-3 md:mb-4">미션 달성 현황</h1>

        <div className="flex gap-2 md:gap-4 mb-3 md:mb-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 md:px-4 md:py-2 border border-gray-300 rounded-md text-xs md:text-sm"
          >
            <option value="all">전체</option>
            <option value="completed">완료</option>
            <option value="pending">검증 대기</option>
            <option value="incomplete">미완료</option>
          </select>
        </div>
      </div>

      {/* 데스크톱 테이블 뷰 */}
      <div className="hidden md:block">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <ScrollArea className="w-full h-[calc(100vh-250px)]">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                    <TableHead className="min-w-[140px] font-semibold">
                      멤버
                    </TableHead>
                    <TableHead className="min-w-[110px] font-semibold">달성률</TableHead>
                    {missions.map((mission) => (
                      <TableHead key={mission.id} className="text-center min-w-[120px]">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-xs">{mission.title}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            {mission.mission_type === 'workout' ? '운동' : mission.mission_type === 'diet' ? '식단' : '커스텀'}
                          </span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const completionRate = calculateCompletionRate(user);

                    return (
                      <TableRow key={user.id} className="hover:bg-gray-50/50">
                        <TableCell className="py-3">
                          <div>
                            <div className="text-xs font-medium text-gray-900">{user.name}</div>
                            <div className="text-[11px] text-gray-500">@{user.username}</div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5 min-w-[50px]">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full transition-all"
                                style={{ width: `${completionRate}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-900 min-w-[35px]">{completionRate}%</span>
                          </div>
                        </TableCell>
                        {missions.map((mission) => (
                          <TableCell key={mission.id} className="text-center py-3">
                            {getStatusBadge(user.completions[mission.id])}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* 모바일 카드 뷰 */}
      <div className="md:hidden space-y-2">
        {users.map((user) => {
          const completionRate = calculateCompletionRate(user);

          return (
            <Card key={user.id} className="overflow-hidden border-l-4 border-l-blue-500">
              <CardHeader className="p-3 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-semibold truncate">{user.name}</CardTitle>
                    <CardDescription className="text-xs truncate">@{user.username}</CardDescription>
                  </div>
                  <div className="flex flex-col items-end ml-3">
                    <span className="text-lg font-bold text-blue-600 leading-none">{completionRate}%</span>
                  </div>
                </div>
                <div className="mt-1.5 bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="space-y-1.5">
                  {missions.map((mission) => (
                    <div key={mission.id} className="flex items-center justify-between py-1.5 border-b last:border-b-0 border-gray-100">
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="text-xs font-medium text-gray-900 truncate leading-tight">{mission.title}</p>
                        <p className="text-[10px] text-gray-500 leading-tight">
                          {mission.mission_type === 'workout' ? '운동' : mission.mission_type === 'diet' ? '식단' : '커스텀'}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusBadge(user.completions[mission.id])}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {users.length === 0 && (
        <div className="text-center py-8 md:py-12 text-sm md:text-base text-gray-500">
          참가자가 없습니다.
        </div>
      )}
    </div>
  );
}
