'use client';
import { useState, useEffect } from 'react';
import {
  ProcessedMeal,
  Challenges,
  ChallengeParticipant,
  DailyRecords,
} from '@/types/dietDetaileTableTypes';

interface DietRecord {
  id: string;
  record_date: string;
  challenge_participants: {
    id: string;
    users: {
      username: string;
      name: string;
    };
  };
  feedbacks: {
    id: string;
    coach_feedback: string | null;
    coach_memo: string | null;
    updated_at: string;
    created_at: string;
  } | null;
  meals: {
    breakfast: Array<{
      id: string;
      description: string;
      meal_time: string;
    }>;
    lunch: Array<{
      id: string;
      description: string;
      meal_time: string;
    }>;
    dinner: Array<{
      id: string;
      description: string;
      meal_time: string;
    }>;
    snack: Array<{
      id: string;
      description: string;
      meal_time: string;
    }>;
    supplement: Array<{
      id: string;
      description: string;
      meal_time: string;
    }>;
  };
}

interface DietResponse {
  data: DietRecord[];
  count: number;
}

interface Challenge {
  challenge_id: string;
  challenges: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    challenge_participants: {
      id: string;
      service_user_id: string;
    }[];
  };
}

export const useDietData = (
  challengeId: string,
  selectedDate?: string,
  page: number = 1,
  limit: number = 10
) => {
  const [dietRecords, setDietRecords] = useState<DietRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [adminData, setAdminData] = useState({
    admin_role: '',
    username: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [initialLimit, setInitialLimit] = useState(30);

  // 초기 데이터 로드 (challenges와 admin data)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsInitialLoading(true);

        // Promise.all을 사용하여 병렬로 데이터 가져오기
        const [challengesResponse, adminResponse] = await Promise.all([
          fetch('/api/challenges'),
          fetch('/api/admin-users'),
        ]);

        if (!challengesResponse.ok || !adminResponse.ok) {
          throw new Error('Failed to fetch initial data');
        }

        const [challengeData, adminData] = await Promise.all([
          challengesResponse.json(),
          adminResponse.json(),
        ]);

        setChallenges(challengeData);
        setAdminData(adminData);
        setError(null);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setError('초기 데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // 식단 데이터 로드
  useEffect(() => {
    const fetchDietData = async () => {
      if (!challengeId || isInitialLoading) return;

      try {
        setLoading(true);
        const url = new URL('/api/diet-table', window.location.origin);
        url.searchParams.append('challengeId', challengeId);
        url.searchParams.append('page', page.toString());
        url.searchParams.append(
          'limit',
          page === 1 ? initialLimit.toString() : limit.toString()
        );

        if (selectedDate) {
          url.searchParams.append('date', selectedDate);
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch diet records');
        }

        const data: DietResponse = await response.json();

        // 받아온 데이터 로깅
        // console.log("[useDietData] Raw API response:", {
        //   firstRecord: data.data[0],
        //   totalCount: data.count,
        //   allRecords: data.data,
        // });

        // 첫 페이지에서 데이터가 30개 이하면 모두 불러오기
        if (page === 1) {
          setDietRecords(data.data);
          setTotalCount(data.count);
          setHasMore(data.count > initialLimit);
        } else {
          // 이전 데이터 유지하면서 새 데이터 추가
          setDietRecords((prevRecords) => [...prevRecords, ...data.data]);
          setHasMore(data.data.length === limit);
        }
        setError(null);
      } catch (error) {
        console.error('Error fetching diet data:', error);
        setError('식단 데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchDietData();
  }, [challengeId, selectedDate, page, limit, isInitialLoading]);

  // 데이터 변환
  const processedRecords = dietRecords.map((record): ProcessedMeal => {
    //  console.log("[useDietData] Processing record:", record);

    const challenge = challenges.find(
      (c) => c.challenges.id === challengeId
    )?.challenges;

    // console.log("[useDietData] Processing record feedbacks:", {
    //   recordId: record.id,
    //   feedbacks: record.feedbacks,
    //   feedbackData: record.feedbacks
    //     ? {
    //         id: record.feedbacks.id,
    //         coach_feedback: record.feedbacks.coach_feedback,
    //         coach_memo: record.feedbacks.coach_memo,
    //       }
    //     : null,
    // });

    return {
      challenge_id: challengeId,
      challenges: {
        id: challengeId,
        title: challenge?.title || '',
        start_date: challenge?.start_date || '',
        end_date: challenge?.end_date || '',
        challenge_participants: [],
      },
      user: {
        id: record.challenge_participants.id,
        username: record.challenge_participants.users.username,
        name: record.challenge_participants.users.name,
      },
      daily_records: {
        id: record.id,
        record_date: record.record_date,
        feedback:
          record.feedbacks && record.feedbacks.coach_feedback
            ? {
                id: record.feedbacks.id,
                coach_feedback: record.feedbacks.coach_feedback,
                coach_memo: record.feedbacks.coach_memo,
                daily_record_id: record.id,
                updated_at: record.feedbacks.updated_at,
                created_at: record.feedbacks.created_at,
              }
            : null,
        meals: {
          breakfast: record.meals.breakfast || [],
          lunch: record.meals.lunch || [],
          dinner: record.meals.dinner || [],
          snack: record.meals.snack || [],
          supplement: record.meals.supplement || [],
        },
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      record_date: record.record_date,
    };
  });

  // 사용자별 업로드 수 계산
  const userUploadCounts = dietRecords.reduce((acc, record) => {
    const userId = record.challenge_participants.id;
    acc[userId] = (acc[userId] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  // 데이터 정렬
  const sortedRecords = [...processedRecords].sort((a, b) => {
    // 먼저 총 업로드 수로 정렬 (많은 순)
    const uploadsA = userUploadCounts[a.user.id] || 0;
    const uploadsB = userUploadCounts[b.user.id] || 0;

    if (uploadsA !== uploadsB) {
      return uploadsB - uploadsA; // 내림차순
    }

    // 업로드 수가 같은 경우 이름으로 정렬
    const nameA = a.user.name || '';
    const nameB = b.user.name || '';
    return nameA.localeCompare(nameB);
  });

  // 변환된 데이터 로깅
  // console.log("[useDietData] Processed and sorted records:", {
  //   firstProcessedRecord: sortedRecords[0],
  //   totalProcessed: sortedRecords.length,
  //   allProcessedRecords: sortedRecords,
  // });

  return {
    dietRecords: sortedRecords,
    challenges,
    adminData,
    loading,
    error,
    totalCount,
    isInitialLoading,
    hasMore,
  };
};
