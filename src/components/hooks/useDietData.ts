'use client';
import { useState, useEffect, useMemo } from 'react';
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
    let isMounted = true;

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

        if (isMounted) {
          setChallenges(challengeData);
          setAdminData(adminData);
          setError(null);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        if (isMounted) {
          setError('초기 데이터를 불러오는데 실패했습니다.');
        }
      } finally {
        if (isMounted) {
          setIsInitialLoading(false);
        }
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  // 식단 데이터 로드
  useEffect(() => {
    let isMounted = true;

    const fetchDietData = async () => {
      if (!challengeId || isInitialLoading) return;

      try {
        setLoading(true);
        const url = new URL('/api/diet-table', window.location.origin);
        url.searchParams.append('challengeId', challengeId);
        url.searchParams.append('page', page.toString());
        url.searchParams.append('limit', '1000'); // 🔥 무제한에 가깝게

        // 페이지 크기 최적화: 첫 페이지는 화면에 표시할 만큼만 가져오기
        const pageSize = page === 1 ? Math.min(initialLimit, 10) : limit;
        url.searchParams.append('limit', pageSize.toString());

        if (selectedDate) {
          url.searchParams.append('date', selectedDate);
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch diet records');
        }

        const data: DietResponse = await response.json();

        if (!isMounted) return;

        // 첫 페이지에서는 이전 데이터를 대체
        if (page === 1) {
          setDietRecords(data.data);
          setTotalCount(data.count);
          setHasMore(data.count > pageSize);
        } else {
          // 페이지 2 이상에서는 새 데이터만 추가 (중복 방지)
          setDietRecords((prevRecords) => {
            // 이미 있는 ID는 제외하고 새 데이터만 추가
            const existingIds = new Set(prevRecords.map((record) => record.id));
            const newRecords = data.data.filter(
              (record) => !existingIds.has(record.id)
            );
            return [...prevRecords, ...newRecords];
          });
          setHasMore(data.data.length === limit);
        }

        setError(null);
      } catch (error) {
        console.error('Error fetching diet data:', error);
        if (isMounted) {
          setError('식단 데이터를 불러오는데 실패했습니다.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDietData();

    return () => {
      isMounted = false;
    };
  }, [challengeId, selectedDate, page, limit, isInitialLoading, initialLimit]);

  // 데이터 변환 및 정렬 - useMemo로 최적화
  const processedAndSortedRecords = useMemo(() => {
    const challenge = challenges.find(
      (c) => c.challenges.id === challengeId
    )?.challenges;

    const userUploadCounts: Record<string, number> = {};
    for (const record of dietRecords) {
      const userId = record.challenge_participants.id;
      userUploadCounts[userId] = (userUploadCounts[userId] || 0) + 1;
    }

    // ✅ 콘솔 테스트용: 미작성 피드백 대상 (KST 기준으로 +9h)
    if (selectedDate) {
      const feedbackMissingList = dietRecords.filter((r) => {
        const utcDate = new Date(r.record_date);
        const kstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);
        const kstDateOnly = kstDate.toISOString().split('T')[0];

        const hasMeal = Object.values(r.meals).some((mealArray) =>
          mealArray.some((mealItem) => mealItem.description.trim() !== '')
        );

        const noFeedback =
          !r.feedbacks?.coach_feedback ||
          r.feedbacks.coach_feedback.trim() === '';

        return kstDateOnly === selectedDate && hasMeal && noFeedback;
      });
    }

    return dietRecords
      .map(
        (record): ProcessedMeal => ({
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
        })
      )
      .sort((a, b) => {
        const uploadsA = userUploadCounts[a.user.id] || 0;
        const uploadsB = userUploadCounts[b.user.id] || 0;
        if (uploadsA !== uploadsB) return uploadsB - uploadsA;
        return a.user.name.localeCompare(b.user.name);
      });
  }, [challengeId, challenges, dietRecords, selectedDate]);

  // 변환된 데이터 로깅
  // console.log("[useDietData] Processed and sorted records:", {
  //   firstProcessedRecord: sortedRecords[0],
  //   totalProcessed: sortedRecords.length,
  //   allProcessedRecords: sortedRecords,
  // });

  const fetchAllDietData = async (): Promise<any[]> => {
    try {
      const url = new URL('/api/diet-table', window.location.origin);
      url.searchParams.append('challengeId', challengeId);
      url.searchParams.append('page', '1');
      url.searchParams.append('limit', '1000'); // 통계용

      if (selectedDate) {
        url.searchParams.append('date', selectedDate);
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch all diet records');
      const data: DietResponse = await response.json();
      return data.data;
    } catch (err) {
      console.error('Error fetching all diet records:', err);
      return [];
    }
  };

  return {
    dietRecords: processedAndSortedRecords,
    challenges,
    adminData,
    loading,
    error,
    totalCount,
    isInitialLoading,
    hasMore,
    fetchAllDietData,
    resetData: () => {
      setDietRecords([]);
      setTotalCount(0);
      setHasMore(true);
    },
  };
};
