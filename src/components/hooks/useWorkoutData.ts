// hooks/useWorkoutData.ts
import { useState, useEffect } from 'react';
import { WorkoutData, WorkoutStatistics } from '@/types/workoutTableTypes';

export const useWorkoutData = (
  challengeId: string,
  selectedDate: string,
  page: number
) => {
  const [workoutRecords, setWorkoutRecords] = useState<WorkoutData[]>([]);
  const [workoutStats, setWorkoutStats] = useState<WorkoutStatistics>({
    total_workouts: 100,
    active_users_today: 10,
    total_users_today: 10,
    weekly_participation_rate: 60.1,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [hasMore, setHasMore] = useState<boolean>(true);

  useEffect(() => {
    const fetchWorkoutData = async () => {
      try {
        setLoading(true);

        // API 호출 (실제 환경에서는 아래 URL을 실제 API 엔드포인트로 변경해야 합니다)
        const response = await fetch(
          `/api/workouts?challengeId=${challengeId}&date=${selectedDate}&page=${page}`
        );

        if (!response.ok) {
          throw new Error('워크아웃 데이터를 불러오는데 실패했습니다');
        }

        const data = await response.json();

        // 페이지가 1이면 데이터를 새로 설정하고, 아니면 기존 데이터에 추가합니다
        if (page === 1) {
          setWorkoutRecords(data.workouts || []);
        } else {
          setWorkoutRecords((prev) => [...prev, ...(data.workouts || [])]);
        }

        // 통계 데이터 설정
        if (data.statistics) {
          setWorkoutStats(data.statistics);
        }

        // 더 불러올 데이터가 있는지 여부를 설정합니다
        setHasMore(data.hasMore || false);
      } catch (error) {
        console.error('운동 데이터 로딩 에러:', error);
      } finally {
        setLoading(false);
      }
    };

    // 실제 API가 구현되기 전에는 목업 데이터를 사용하여 테스트할 수 있습니다
    const loadMockData = () => {
      setTimeout(() => {
        // 목업 데이터 예시
        const mockData: WorkoutData[] = [
          {
            id: '1',
            user: {
              username: 'Ashly',
              name: 'Ashly',
            },
            workout_records: {
              id: 'rec1',
              weeks: {
                week1: { completion_rate: 100, sessions: 1 },
                week2: { completion_rate: 100, sessions: 2 },
                week3: { completion_rate: 150, sessions: 2 },
                week4: { completion_rate: 90, sessions: 1 },
                week5: { completion_rate: 100, sessions: 2 },
                week6: { completion_rate: 100, sessions: 2 },
                week7: { completion_rate: 100, sessions: 2 },
              },
            },
            center_name: '영등포어학원 휘트니',
          },
          {
            id: '2',
            user: {
              username: 'Ashly',
              name: 'Ashly',
            },
            workout_records: {
              id: 'rec2',
              weeks: {
                week1: { completion_rate: 100, sessions: 1 },
                week2: { completion_rate: 100, sessions: 2 },
                week3: { completion_rate: 150, sessions: 2 },
                week4: { completion_rate: 90, sessions: 1 },
                week5: { completion_rate: 100, sessions: 2 },
                week6: { completion_rate: 100, sessions: 2 },
                week7: { completion_rate: 88, sessions: 2 },
              },
            },
            center_name: '영등포어학원 휘트니2',
          },
          // 나머지 3개 행에 대한 목업 데이터
          ...Array(3)
            .fill(null)
            .map((_, index) => ({
              id: `${index + 3}`,
              user: {
                username: 'Ashly',
                name: 'Ashly',
              },
              workout_records: {
                id: `rec${index + 3}`,
                weeks: {
                  week1: { completion_rate: 20, sessions: 0 },
                  week2: { completion_rate: 10, sessions: 0 },
                  week3: { completion_rate: 40, sessions: 2 },
                  week4: { completion_rate: 90, sessions: 1 },
                  week5: { completion_rate: 50, sessions: 0 },
                  week6: { completion_rate: 50, sessions: 0 },
                  week7: { completion_rate: 50, sessions: 0 },
                },
              },
              center_name: '영등포어학원 휘트니3',
            })),
        ];

        if (page === 1) {
          setWorkoutRecords(mockData);
        } else {
          // 페이지 2 이상에서는 더 이상 데이터가 없다고 가정
          setHasMore(false);
        }

        setLoading(false);
      }, 500); // 로딩 시뮬레이션을 위한 지연
    };

    // 실제 API 호출 대신 목업 데이터 사용
    loadMockData();

    // 실제 API가 준비되면 아래 라인으로 교체
    // fetchWorkoutData();
  }, [challengeId, selectedDate, page]);

  return { workoutRecords, workoutStats, loading, hasMore };
};
