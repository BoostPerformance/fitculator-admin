'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import supabase from '@/lib/supabase';
import Title from '@/components/layout/title';
import { FaPlus, FaEdit, FaTrash, FaTrophy, FaMedal } from 'react-icons/fa';
import BenchmarkModal from '@/components/benchmark/BenchmarkModal';
import BenchmarkRecordModal from '@/components/benchmark/BenchmarkRecordModal';
import { useChallenge } from '@/components/hooks/useChallenges';
import { useSession } from '@/components/hooks/useSession';

interface Benchmark {
  id: string;
  title: string;
  description: string;
  unit: 'time' | 'distance' | 'weight' | 'reps' | 'custom';
  unit_label: string;
  is_lower_better: boolean;
  challenge_id: string;
  created_at: string;
  updated_at: string;
}

interface BenchmarkRecord {
  id: string;
  benchmark_id: string;
  user_id: string;
  record_value: number;
  record_date: string;
  verification_level: 'self_reported' | 'photo_verified' | 'official_verified';
  created_at: string;
  users: {
    id: string;
    name: string;
    birth: string;
  };
  workout_id?: string;
}

export default function BenchmarksPage() {
  const params = useParams();
  const challengeId = params.challengeId as string;
  const queryClient = useQueryClient();
  const [selectedBenchmark, setSelectedBenchmark] = useState<Benchmark | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingBenchmark, setEditingBenchmark] = useState<Benchmark | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [editingRecord, setEditingRecord] = useState<BenchmarkRecord | null>(null);
  const { challenges } = useChallenge();
  const currentChallenge = challenges?.find((c) => c.challenges.id === challengeId);
  const { session } = useSession();
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  
  // Get auth_users ID from email
  useEffect(() => {
    const fetchAuthUserId = async () => {
      if (session?.user?.email) {
        const { data: authUser, error } = await supabase
          .from('auth_users')
          .select('id, user_id')
          .eq('email', session.user.email)
          .single();
        
        if (authUser) {
// console.log('Auth user data:', authUser);
          // Use user_id if it exists, otherwise use id
          setAuthUserId(authUser.user_id || authUser.id);
        }
        if (error) {
// console.error('Error fetching auth user:', error);
        }
      }
    };
    
    fetchAuthUserId();
  }, [session]);

  // 벤치마크 목록 조회
  const { data: benchmarks, isLoading: benchmarksLoading } = useQuery({
    queryKey: ['benchmarks', challengeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('benchmarks')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Benchmark[];
    },
  });

  // 벤치마크 기록 조회 (리더보드)
  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['benchmark-leaderboard', selectedBenchmark?.id],
    queryFn: async () => {
      if (!selectedBenchmark) return [];
      
// console.log('리더보드 조회 시작:', selectedBenchmark.id);
      
      const { data, error } = await supabase
        .from('benchmark_records')
        .select(`
          *,
          users!benchmark_records_user_id_fkey (
            id,
            name,
            birth
          )
        `)
        .eq('benchmark_id', selectedBenchmark.id)
        .order('record_value', { ascending: selectedBenchmark.is_lower_better });

// console.log('리더보드 쿼리 결과:', { data, error });
      
      if (error) {
// console.error('리더보드 쿼리 에러:', error);
        throw error;
      }
      
      // 중복 제거 (사용자별 최고 기록만)
      const bestRecords = new Map<string, any>();
      data?.forEach((record: any) => {
        const existing = bestRecords.get(record.user_id);
        if (!existing) {
          bestRecords.set(record.user_id, record);
        } else {
          // 더 좋은 기록으로 업데이트
          const isBetter = selectedBenchmark.is_lower_better 
            ? record.record_value < existing.record_value
            : record.record_value > existing.record_value;
          
          if (isBetter) {
            bestRecords.set(record.user_id, record);
          }
        }
      });
      
      // 순위에 따라 정렬
      return Array.from(bestRecords.values()).sort((a, b) => {
        return selectedBenchmark.is_lower_better 
          ? a.record_value - b.record_value
          : b.record_value - a.record_value;
      });
    },
    enabled: !!selectedBenchmark,
  });

  // 챌린지 멤버 조회 - API 사용
  const { data: members } = useQuery({
    queryKey: ['challenge-members', challengeId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/challenge-participants?challenge_id=${challengeId}&limit=100`);
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error('Failed to fetch members');
        }
        
        const members = result.data
          ?.filter((p: any) => p.status !== 'dropped')
          ?.map((p: any) => ({
            id: p.users?.id || p.service_user_id,
            name: p.users?.name || p.users?.username || '이름 없음',
            birth: p.users?.birth
          }))
          .filter(Boolean) || [];
        
// console.log('API로 조회된 멤버:', members);
        return members;
      } catch (error) {
// console.error('멤버 조회 실패:', error);
        return [];
      }
    },
  });

  // 벤치마크 추가/수정
  const benchmarkMutation = useMutation({
    mutationFn: async (benchmark: Partial<Benchmark>) => {
      if (benchmark.id) {
        const { error } = await supabase
          .from('benchmarks')
          .update(benchmark)
          .eq('id', benchmark.id);
        if (error) throw error;
      } else {
        const newBenchmark = {
          ...benchmark,
          challenge_id: challengeId,
          created_by: authUserId
        };
// console.log('Creating benchmark with data:', newBenchmark);
// console.log('Auth user ID for created_by:', authUserId);
        
        const { error } = await supabase
          .from('benchmarks')
          .insert(newBenchmark);
        if (error) {
// console.error('Error creating benchmark:', error);
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benchmarks', challengeId] });
      setIsModalOpen(false);
      setEditingBenchmark(null);
    },
  });

  // 벤치마크 삭제
  const deleteBenchmarkMutation = useMutation({
    mutationFn: async (benchmarkId: string) => {
      const { error } = await supabase
        .from('benchmarks')
        .update({ is_active: false })
        .eq('id', benchmarkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benchmarks', challengeId] });
      setSelectedBenchmark(null);
    },
  });

  // 벤치마크 기록 추가/수정
  const recordMutation = useMutation({
    mutationFn: async (record: Partial<BenchmarkRecord>) => {
// console.log('기록 저장 데이터:', record);
      
      if (record.id) {
        const { data, error } = await supabase
          .from('benchmark_records')
          .update(record)
          .eq('id', record.id)
          .select();
        
        if (error) {
// console.error('기록 수정 에러:', error);
          throw error;
        }
// console.log('기록 수정 성공:', data);
      } else {
        const { data, error } = await supabase
          .from('benchmark_records')
          .insert(record)
          .select();
        
        if (error) {
// console.error('기록 추가 에러:', error);
          throw error;
        }
// console.log('기록 추가 성공:', data);
      }
    },
    onSuccess: () => {
      // 리더보드 데이터 무효화하여 즉시 새로고침
      queryClient.invalidateQueries({ queryKey: ['benchmark-leaderboard', selectedBenchmark?.id] });
      // 추가로 모든 벤치마크 관련 쿼리도 무효화
      queryClient.invalidateQueries({ queryKey: ['benchmark-leaderboard'] });
      // 강제로 리더보드 다시 가져오기
      queryClient.refetchQueries({ queryKey: ['benchmark-leaderboard', selectedBenchmark?.id] });
      setIsRecordModalOpen(false);
// console.log('기록 저장 완료 - 순위 테이블 업데이트');
    },
    onError: (error) => {
// console.error('기록 저장 실패:', error);
      alert('기록 저장에 실패했습니다: ' + error.message);
    },
  });

  const formatValue = (value: number, unit: string, unitLabel: string) => {
    if (unit === 'time') {
      const hours = Math.floor(value / 3600);
      const minutes = Math.floor((value % 3600) / 60);
      const seconds = value % 60;
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${value}${unitLabel}`;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <FaTrophy className="text-yellow-500" />;
    if (rank === 2) return <FaMedal className="text-gray-400" />;
    if (rank === 3) return <FaMedal className="text-orange-600" />;
    return <span className="text-gray-500">{rank}</span>;
  };

  if (benchmarksLoading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="flex-1 p-4 sm:p-2">
      <div className="px-8 pt-4 sm:px-3 sm:pt-3">
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
        <Title title="벤치마크" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-3 mt-6 sm:mt-4 px-8 sm:px-3">
        {/* 벤치마크 목록 */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-3">
            <div className="flex justify-between items-center mb-4 sm:mb-3">
              <h2 className="text-lg sm:text-base font-semibold dark:text-white">벤치마크 목록</h2>
              <button
                onClick={() => {
                  setEditingBenchmark(null);
                  setIsModalOpen(true);
                }}
                className="p-2 sm:p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors"
              >
                <FaPlus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {benchmarks?.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8 sm:py-6 text-sm">
                  벤치마크가 없습니다.
                </p>
              )}
              {benchmarks?.map((benchmark) => (
                <div
                  key={benchmark.id}
                  className={`p-3 sm:p-4 border dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-h-[56px] ${
                    selectedBenchmark?.id === benchmark.id ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400' : ''
                  }`}
                  onClick={() => setSelectedBenchmark(benchmark)}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm sm:text-base dark:text-white truncate">{benchmark.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{benchmark.description}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 mt-1">
                        단위: {benchmark.unit_label} | {benchmark.is_lower_better ? '낮을수록 좋음' : '높을수록 좋음'}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingBenchmark(benchmark);
                          setIsModalOpen(true);
                        }}
                        className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      >
                        <FaEdit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('정말 삭제하시겠습니까?')) {
                            deleteBenchmarkMutation.mutate(benchmark.id);
                          }
                        }}
                        className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <FaTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 리더보드 */}
        <div className="lg:col-span-2">
          {selectedBenchmark ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-3">
              <div className="flex justify-between items-center mb-4 sm:mb-3 gap-2">
                <h2 className="text-lg sm:text-base font-semibold dark:text-white truncate">{selectedBenchmark.title} 순위</h2>
                <button
                  onClick={() => setIsRecordModalOpen(true)}
                  className="px-4 py-2 sm:px-3 sm:py-2.5 min-h-[44px] bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 active:bg-green-700 transition-colors whitespace-nowrap"
                >
                  기록 추가
                </button>
              </div>

              {/* 모바일: 카드 뷰 */}
              <div className="sm:block lg:hidden space-y-3">
                {leaderboardLoading ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
                ) : leaderboard?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                    아직 기록이 없습니다.
                  </div>
                ) : (
                  leaderboard?.map((record, index) => (
                    <div key={record.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-100 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-sm">
                            {getRankIcon(index + 1)}
                          </div>
                          <div>
                            <div className="font-medium text-sm dark:text-white">{record.users?.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {record.users?.birth
                                ? `${new Date().getFullYear() - new Date(record.users.birth).getFullYear()}세`
                                : '-'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setEditingRecord(record)}
                          className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="기록 수정"
                        >
                          <FaEdit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          {formatValue(record.record_value, selectedBenchmark.unit, selectedBenchmark.unit_label)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(record.record_date).toLocaleDateString('ko-KR')}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            record.verification_level === 'official_verified'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : record.verification_level === 'photo_verified'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                          }`}>
                            {record.verification_level === 'official_verified'
                              ? '공식'
                              : record.verification_level === 'photo_verified'
                              ? '사진'
                              : '직접'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 데스크톱: 테이블 뷰 */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left py-2 text-sm text-gray-600 dark:text-gray-300">순위</th>
                      <th className="text-left py-2 text-sm text-gray-600 dark:text-gray-300">이름</th>
                      <th className="text-left py-2 text-sm text-gray-600 dark:text-gray-300">나이</th>
                      <th className="text-left py-2 text-sm text-gray-600 dark:text-gray-300">기록</th>
                      <th className="text-left py-2 text-sm text-gray-600 dark:text-gray-300">날짜</th>
                      <th className="text-left py-2 text-sm text-gray-600 dark:text-gray-300">인증</th>
                      <th className="text-left py-2 text-sm text-gray-600 dark:text-gray-300">수정</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardLoading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</td>
                      </tr>
                    ) : leaderboard?.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                          아직 기록이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      leaderboard?.map((record, index) => (
                        <tr key={record.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="py-2">
                            <div className="flex items-center gap-2">
                              {getRankIcon(index + 1)}
                            </div>
                          </td>
                          <td className="py-2 dark:text-white">{record.users?.name}</td>
                          <td className="py-2 dark:text-gray-300">
                            {record.users?.birth
                              ? `${new Date().getFullYear() - new Date(record.users.birth).getFullYear()}세`
                              : '-'}
                          </td>
                          <td className="py-2 font-semibold dark:text-white">
                            {formatValue(record.record_value, selectedBenchmark.unit, selectedBenchmark.unit_label)}
                          </td>
                          <td className="py-2 dark:text-gray-300">
                            {new Date(record.record_date).toLocaleDateString('ko-KR')}
                          </td>
                          <td className="py-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              record.verification_level === 'official_verified'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : record.verification_level === 'photo_verified'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                            }`}>
                              {record.verification_level === 'official_verified'
                                ? '공식인증'
                                : record.verification_level === 'photo_verified'
                                ? '사진인증'
                                : '직접인증'}
                            </span>
                          </td>
                          <td className="py-2">
                            <button
                              onClick={() => setEditingRecord(record)}
                              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-1 rounded"
                              title="기록 수정"
                            >
                              <FaEdit />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 sm:p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
              <span className="sm:inline lg:hidden">위에서</span>
              <span className="hidden lg:inline">왼쪽에서</span> 벤치마크를 선택해주세요.
            </div>
          )}
        </div>
      </div>

      {/* 벤치마크 추가/수정 모달 */}
      {isModalOpen && (
        <BenchmarkModal
          benchmark={editingBenchmark}
          onClose={() => {
            setIsModalOpen(false);
            setEditingBenchmark(null);
          }}
          onSave={(data) => benchmarkMutation.mutate(data)}
        />
      )}

      {/* 기록 추가 모달 */}
      {isRecordModalOpen && selectedBenchmark && !editingRecord && (
        <BenchmarkRecordModal
          benchmark={selectedBenchmark}
          members={members || []}
          challengeStartDate={currentChallenge?.challenges.start_date}
          challengeEndDate={currentChallenge?.challenges.end_date}
          onClose={() => setIsRecordModalOpen(false)}
          onSave={(data) => recordMutation.mutate(data)}
        />
      )}

      {/* 기록 수정 모달 */}
      {editingRecord && selectedBenchmark && (
        <BenchmarkRecordModal
          benchmark={selectedBenchmark}
          members={members || []}
          challengeStartDate={currentChallenge?.challenges.start_date}
          challengeEndDate={currentChallenge?.challenges.end_date}
          existingRecord={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSave={(data) => recordMutation.mutate({ ...data, id: editingRecord.id })}
        />
      )}
    </div>
  );
}