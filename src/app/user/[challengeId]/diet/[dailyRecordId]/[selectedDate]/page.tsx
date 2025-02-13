'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TextBox from '@/components/textBox';
import Title from '@/components/layout/title';
import TotalFeedbackCounts from '@/components/totalCounts/totalFeedbackCount';
import MealPhotoLayout from '@/components/layout/mealPhotoLayout';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/fixedBars/sidebar';
import { ProcessedMeal } from '@/types/dietDetaileTableTypes';
import Calendar from '@/components/input/calendar';
import {
  DailyMealData,
  UserData,
  PhotoData,
} from '@/types/dietItemContainerTypes';
import calendarUtils from '@/components/utils/calendarUtils';
import DateInput from '@/components/input/dateInput';
import { useFeedback } from '@/components/hooks/useFeedback';

interface CustomAlertProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

const CustomAlert = ({ message, isVisible, onClose }: CustomAlertProps) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 p-4 bg-white rounded-lg shadow-lg border border-green-500 animate-in fade-in slide-in-from-top-3 z-50">
      <div className="flex items-center gap-2">
        <div className="text-green-600">{message}</div>
        <button
          onClick={onClose}
          className="ml-2 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

type PageParams = {
  challengeId: string;
  dailyRecordId: string;
  selectedDate: string; // 명백히 string임을 명시
};

export default function SelectedDate() {
  const router = useRouter();

  const { saveFeedback } = useFeedback();
  const [showAlert, setShowAlert] = useState(false);

  const params = useParams() as PageParams;
  const selectedDate = params.selectedDate;
  const [feedbacksByDate, setFeedbacksByDate] = useState<{
    [key: string]: string;
  }>({});
  const [isDisable, setIsDisable] = useState(false);
  const [challenges, setChallenges] = useState<ProcessedMeal[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  //  const [coachFeedback, setCoachFeedback] = useState('');
  const [challengeTitle, setChallengeTitle] = useState('');
  const [recordDate, setRecordDate] = useState('');
  const [userData, setUserData] = useState({
    id: '',
    name: '사용자',
    username: '',
  });
  const [orgName, setOrgName] = useState({
    username: '코치님',
    organization_name: '조직명',
  });
  // const [commentVisible, setCommentVisible] = useState<{
  //   [key: string]: boolean;
  // }>({});
  // const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [mobileSize, setMobileSize] = useState(true);

  // const [descriptions, setDescriptions] = useState({
  //   breakfast: '',
  //   lunch: '',
  //   dinner: '',
  //   snack: '',
  //   supplement: '',
  // });
  const [challengePeriods, setChallengePeriods] = useState({
    start_date: '',
    end_date: '',
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allDailyMeals, setAllDailyMeals] = useState<DailyMealData[]>([]); // 전체 기록
  const [filteredDailyMeals, setFilteredDailyMeals] = useState<DailyMealData[]>(
    []
  ); // 필터링된 기록

  const handleSaveFeedback = async (feedback: string) => {
    try {
      if (!recordDate) {
        console.error('No record date selected');
        return;
      }

      const currentChallenge = challenges.find(
        (challenge) => challenge.challenge_id === selectedChallengeId
      );

      if (!currentChallenge) {
        console.error('Challenge not found');
        return;
      }

      const participant =
        currentChallenge.challenges.challenge_participants.find(
          (participant) => participant.users.id === params.dailyRecordId
        );

      if (!participant) {
        console.error('Participant not found');
        return;
      }

      const dailyRecord = participant.daily_records.find(
        (record) => record.record_date === recordDate
      );

      if (!dailyRecord) {
        console.error('Daily record not found');
        return;
      }

      // API 호출
      await saveFeedback({
        daily_record_id: dailyRecord.id,
        coach_feedback: feedback,
      });

      // 데이터 업데이트를 한 번에 처리
      const updatedAllMeals = allDailyMeals.map((meal) =>
        meal.recordDate === recordDate
          ? {
              ...meal,
              feedbacks: {
                ...meal.feedbacks,
                coach_feedback: feedback,
              },
            }
          : meal
      );

      // console.log('업데이트된 상태:', {
      //   recordDate,
      //   feedback,
      //   updatedAllMeals: updatedAllMeals.find(
      //     (meal) => meal.recordDate === recordDate
      //   ),
      // });

      //저장 하자마자 바로 로컬 상태 업데이트
      setAllDailyMeals(updatedAllMeals);
      setFilteredDailyMeals(
        updatedAllMeals.filter((meal) => meal.recordDate === recordDate)
      );

      setFeedbacksByDate((prev) => ({
        ...prev,
        [recordDate]: feedback,
      }));

      console.log('State updates complete:', {
        recordDate,
        feedback,
        updatedState: {
          allDailyMeals: updatedAllMeals.find(
            (meal) => meal.recordDate === recordDate
          ),
          filteredDailyMeals: updatedAllMeals.filter(
            (meal) => meal.recordDate === recordDate
          ),
        },
      });

      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to save feedback:', error);
    }
  };

  // 달력 날짜가 변경될 때마다 해당 월의 기록만 필터링하는 함수
  const filterMealsByMonth = useCallback(
    (date: Date) => {
      if (!challengePeriods.start_date || !challengePeriods.end_date) return;

      const year = date.getFullYear();
      const month = date.getMonth();

      const filtered = allDailyMeals.filter((meal) => {
        const mealDate = new Date(meal.recordDate);

        if (params.selectedDate) {
          return meal.recordDate === params.selectedDate;
        }

        const isInChallengeRange =
          new Date(meal.recordDate) >= new Date(challengePeriods.start_date) &&
          new Date(meal.recordDate) <= new Date(challengePeriods.end_date);

        const isInSelectedMonth =
          mealDate.getFullYear() === year && mealDate.getMonth() === month;

        return isInChallengeRange && isInSelectedMonth;
      });

      setFilteredDailyMeals(filtered);
    },
    [
      challengePeriods.start_date,
      challengePeriods.end_date,
      allDailyMeals,
      params.selectedDate,
    ]
  );

  // 1.
  useEffect(() => {
    filterMealsByMonth(currentDate);

    const handleResize = () => {
      setMobileSize(window.innerWidth <= 640);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [currentDate, filterMealsByMonth]);

  const weekdays = ['월', '화', '수', '목', '금', '토', '일'];

  const handleDateClick = (date: Date) => {
    const formattedDate = calendarUtils.formatDate(date);
    setRecordDate(formattedDate);

    // 선택된 날짜에 해당하는 기록만 필터링
    const filtered = allDailyMeals.filter((meal) => {
      return (
        meal.recordDate === formattedDate &&
        new Date(meal.recordDate) >= new Date(challengePeriods.start_date) &&
        new Date(meal.recordDate) <= new Date(challengePeriods.end_date)
      );
    });

    setFilteredDailyMeals(filtered);
  };

  const {
    handlePrevMonth: origHandlePrevMonth,
    handleNextMonth: origHandleNextMonth,
  } = calendarUtils.getNavigationHandlers(currentDate, setCurrentDate);

  const handlePrevMonth = () => {
    origHandlePrevMonth();
    filterMealsByMonth(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    origHandleNextMonth();
    filterMealsByMonth(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const handleChallengeSelect = (challengeId: string) => {
    setSelectedChallengeId(challengeId);
    const selectedChallenge = challenges.find(
      (challenge) => challenge.challenges.id === challengeId
    );

    if (selectedChallenge) {
      setChallengeTitle(selectedChallenge.challenges.title);
    }
  };

  // const userMeals = meals.filter(
  //   (meal: Meals) =>
  //     meal.daily_records.challenge_participants.users.id === userData.id &&
  //     meal.daily_records.record_date === recordDate
  // );

  // const handleScroll = () => {
  //   if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
  //     setVisibleItems((prev) => prev + 2);
  //   }
  // };

  const handleFeedbackChange = (date: string, feedback: string) => {
    setFeedbacksByDate((prev) => {
      const newState = {
        ...prev,
        [date]: feedback,
      };

      console.log('feedbacksByDate 업데이트:', {
        date,
        feedback,
        전체상태newState: newState,
      });

      return newState;
    });
  };

  const handleGenerateAnalyse = async () => {
    try {
      setIsDisable(true);

      // 현재 선택된 daily record의 ID 찾기
      const currentChallenge = challenges.find(
        (challenge) => challenge.challenge_id === selectedChallengeId
      );

      if (!currentChallenge) {
        console.error('Challenge not found');
        return;
      }

      const participant =
        currentChallenge.challenges.challenge_participants.find(
          (participant) => participant.users.id === params.dailyRecordId
        );

      if (!participant) {
        console.error('Participant not found');
        return;
      }

      const dailyRecord = participant.daily_records.find(
        (record) => record.record_date === recordDate
      );

      if (!dailyRecord) {
        console.error('Daily record not found');
        return;
      }

      // AI 피드백 생성 API 호출
      const response = await fetch('/api/diet-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dailyRecordId: dailyRecord.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI feedback');
      }

      const feedback = await response.json();

      // 피드백 상태 업데이트
      const updatedAllMeals = allDailyMeals.map((meal) =>
        meal.recordDate === recordDate
          ? {
              ...meal,
              feedbacks: {
                ...meal.feedbacks,
                ai_feedback: feedback.ai_feedback,
              },
            }
          : meal
      );
      setAllDailyMeals(updatedAllMeals);

      const updatedFilteredMeals = updatedAllMeals.filter(
        (meal) => meal.recordDate === recordDate
      );
      setFilteredDailyMeals(updatedFilteredMeals);

      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false);
      }, 3000);
    } catch (error) {
      console.error('Error generating AI feedback:', error);
    } finally {
      setIsDisable(false);
    }
  };

  const handleBack = () => {
    router.push(`/user/${params.challengeId}/diet?date=${params.selectedDate}`);
  };

  //2.
  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseURL =
          process.env.NODE_ENV === 'development'
            ? '/api' // 개발 환경에서는 내부 API 라우트 사용
            : 'https://studio-admin.fitculator.pro/api'; // 프로덕션 환경에서는 실제 API 서버 사용

        //const timestamp = new Date().getTime();
        const timestamp = new Date().getTime();

        const mealsResponse = await fetch(`${baseURL}/meals?t=${timestamp}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            'If-None-Match': '', // ETag 무시
            'If-Modified-Since': '', // Last-Modified 무시
          },
          cache: 'no-store',
          next: { revalidate: 0 },
        });
        if (!mealsResponse.ok) {
          throw new Error('Failed to fetch meals data');
        }

        // console.log('Response headers:', {
        //   cache: mealsResponse.headers.get('cache-control'),
        //   timestamp: mealsResponse.headers.get('x-request-time'),
        //   etag: mealsResponse.headers.get('etag'),
        // });

        const mealsData = await mealsResponse.json();
        // console.log('새로 불러온 데이터:', mealsData);

        // console.log('상태 업데이트 전:', {
        //   allDailyMeals,
        //   filteredDailyMeals,
        // });
        if (!Array.isArray(mealsData)) {
          console.error('Invalid meals data format:', mealsData);
          return;
        }

        const userMeals = mealsData.filter(
          (meal: {
            daily_records?: {
              challenge_participants?: { users?: { id: string } };
            };
          }) =>
            meal.daily_records?.challenge_participants?.users?.id ===
            params.dailyRecordId
        );

        const mealsByDate = userMeals.reduce(
          (
            acc: { [key: string]: DailyMealData },
            meal: {
              daily_records: {
                record_date: string;
                feedbacks?: {
                  coach_feedback?: string;
                  ai_feedback?: string;
                };
              };
              meal_type: string;
              description?: string;
              meal_photos?: PhotoData[];
              updated_at?: string;
            }
          ) => {
            const date = meal.daily_records.record_date;

            // console.log('각 식단의 피드백 데이터:', {
            //   date,
            //   feedbacks: meal.daily_records.feedbacks,
            // });

            if (!acc[date]) {
              acc[date] = {
                recordDate: date,
                meals: {},
                feedbacks: {
                  coach_feedback:
                    meal.daily_records.feedbacks?.coach_feedback || '',
                  ai_feedback: meal.daily_records.feedbacks?.ai_feedback || '',
                },
              };
            }

            const mealType = meal.meal_type.toLowerCase();
            acc[date].meals[mealType] = {
              description: meal.description || '',
              mealPhotos: Array.isArray(meal.meal_photos)
                ? meal.meal_photos
                : meal.meal_photos
                ? [meal.meal_photos]
                : [],
              updatedAt: meal.updated_at || '',
            };

            return acc;
          },
          {}
        );

        const mealsByDateValues = Object.values(mealsByDate) as DailyMealData[];
        const sortedMeals = mealsByDateValues.sort(
          (a, b) =>
            new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime()
        );

        // console.log('Fresh data loaded at:', new Date().toISOString());
        // console.log('최종 정렬된 데이터:', sortedMeals);

        setAllDailyMeals(sortedMeals); // 전체 기록 저장

        if (selectedDate) {
          setRecordDate(selectedDate);

          const filtered = sortedMeals.filter(
            (meal) => meal.recordDate === selectedDate
          );
          setFilteredDailyMeals(filtered);
        }

        // 현재 월의 기록으로 필터링

        const challengesResponse = await fetch('/api/challenges');

        if (!challengesResponse.ok) {
          throw new Error('Failed to fetch challenges');
        }
        const challengeData = await challengesResponse.json();
        setChallenges(challengeData);

        const currentChallenge = challengeData.find(
          (challenge: ProcessedMeal) =>
            challenge.challenge_id === params.challengeId
        );
        if (currentChallenge) {
          setChallengeTitle(currentChallenge.challenges.title);
          setSelectedChallengeId(currentChallenge.challenges.id);
          setChallengePeriods({
            start_date: currentChallenge.challenges.start_date,
            end_date: currentChallenge.challenges.end_date,
          });
          // 데이터 로드 후 바로 필터링 실행
          filterMealsByMonth(currentDate);
        }
        const challengeParticipantsResponse = await fetch(
          '/api/challenge-participants'
        );
        if (!challengeParticipantsResponse.ok) {
          throw new Error('Failed to fetch admin data');
        }
        const userData = await challengeParticipantsResponse.json();
        setUserData(userData);

        //console.log('userData', userData);
        const currentUser = userData.find((user: UserData) => {
          return user.users.id === params.dailyRecordId;
        });

        if (currentUser) {
          setUserData({
            id: currentUser.users.id,
            name: currentUser.users.name,
            username: currentUser.users.username,
          });
        }

        const orgDataResponse = await fetch('/api/coach-info');

        const orgData = await orgDataResponse.json();

        setOrgName(orgData);

        // console.log('mealsByDateValues', mealsByDateValues);
      } catch (error) {
        console.log('Error fetching data:', error);
      }
    };

    fetchData();

    // window.addEventListener('scroll', handleScroll);
    // return () => window.removeEventListener('scroll', handleScroll);
  }, [params.selectedDate, params.challengeId, params.selectedDate]);

  //3.
  useEffect(() => {
    filterMealsByMonth(currentDate);

    const handleResize = () => {
      setMobileSize(window.innerWidth <= 640); // sm 브레이크포인트 (640px)
    };

    // 초기 화면 크기 설정
    handleResize();

    // 리사이즈 이벤트 리스너 등록
    window.addEventListener('resize', handleResize);

    // 클린업 함수
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [challengePeriods, currentDate, allDailyMeals, filterMealsByMonth]);

  //4.
  useEffect(() => {
    if (recordDate) {
      const filtered = allDailyMeals.filter((meal) => {
        return (
          meal.recordDate === recordDate &&
          new Date(meal.recordDate) >= new Date(challengePeriods.start_date) &&
          new Date(meal.recordDate) <= new Date(challengePeriods.end_date)
        );
      });
      setFilteredDailyMeals(filtered);
    }
  }, [recordDate, allDailyMeals, challengePeriods]);

  //console.log('challengePeriods', challengePeriods);

  const currentChallengeIndex = challenges.find(
    (challenge) => challenge.challenge_id === selectedChallengeId
  );

  const challengeDates = {
    startDate: currentChallengeIndex?.challenges?.start_date || '',
    endDate: currentChallengeIndex?.challenges?.end_date || '',
  };

  const displayMeals = filteredDailyMeals.length
    ? filteredDailyMeals
    : recordDate
    ? [
        {
          recordDate: recordDate,
          meals: {
            breakfast: { description: '', mealPhotos: [], updatedAt: '' },
            lunch: { description: '', mealPhotos: [], updatedAt: '' },
            dinner: { description: '', mealPhotos: [], updatedAt: '' },
            snack: { description: '', mealPhotos: [], updatedAt: '' },
            supplement: { description: '', mealPhotos: [], updatedAt: '' },
          },
          feedbacks: {
            coach_feedback: '',
            ai_feedback: '',
          },
        },
      ]
    : [];

  const calculateChallengeMetrics = () => {
    // 챌린지 전체 일수 계산
    const startDate = new Date(challengePeriods.start_date);
    const endDate = new Date(challengePeriods.end_date);
    const totalDays =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

    // 현재 날짜 기준으로 계산
    const today = new Date();
    const isAfterChallenge = today > endDate;

    let uploadCount = 0;

    allDailyMeals.forEach((dailyMeal) => {
      const recordDate = new Date(dailyMeal.recordDate);

      // 챌린지 기간 내의 기록인지 확인
      const isInRange =
        recordDate >= startDate &&
        (isAfterChallenge ? recordDate <= endDate : recordDate <= today);

      if (isInRange) {
        // 각 식사 타입별로 확인
        Object.values(dailyMeal.meals).forEach((meal) => {
          // 설명이나 사진이 있는 경우에만 카운트
          if (meal.description.trim() !== '' || meal.mealPhotos.length > 0) {
            uploadCount++;
          }
        });
      }
    });

    return {
      total: totalDays,
      count: uploadCount,
    };
  };

  const metrics = useMemo(
    () => calculateChallengeMetrics(),
    [allDailyMeals, challengePeriods]
  );

  // console.log('challenges', selectedChallengeId);
  const [copyMessage, setCopyMessage] = useState<boolean>(false);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage(true);
      setShowAlert(true); // 복사 성공 알림 표시
      setTimeout(() => {
        setCopyMessage(false);
        setShowAlert(false);
      }, 3000);
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  return (
    <div className=" flex sm:flex-col md:flex-col gap-[1rem] sm:bg-[#E4E9FF] sm:min-w-[24rem]">
      <CustomAlert
        message={
          copyMessage
            ? '복사가 완료됐습니다.'
            : isDisable
            ? '피드백 작성 중입니다...'
            : '피드백 작성이 완료됐습니다.'
        }
        isVisible={showAlert || copyMessage}
        onClose={() => {
          setShowAlert(false);
          setCopyMessage(false);
        }}
      />

      <Sidebar
        data={challenges}
        onSelectChallenge={handleChallengeSelect}
        onSelectChallengeTitle={handleChallengeSelect}
        coach={orgName.username}
      />

      <div className="md:px-[1rem]">
        <div className="flex-1 py-[3rem]">
          <div className="sm:px-[1rem]">
            <div className=" flex">
              <div className="text-gray-2 text-1.25-700">
                {orgName.organization_name}&nbsp;
              </div>
              <div className="text-gray-2 text-1.25-700">{challengeTitle}</div>
            </div>

            <Title title={`${userData.name}님의 식단현황`} />

            <TotalFeedbackCounts
              counts={metrics.count.toString()}
              total={metrics.total.toString()}
              borderColor="border-[#FDB810]"
              textColor="text-[#FDB810]"
              title="총 식단 업로드"
            />
          </div>
          {mobileSize ? (
            <div className="flex items-center justify-center flex-col">
              <button
                className=" p-4 drop-shadow-md hover:bg-gray-13 rounded-md border-[0.1rem]"
                onClick={handleBack}
              >
                ← 뒤로가기
              </button>
              <Calendar
                handlePrevMonth={handlePrevMonth}
                handleNextMonth={handleNextMonth}
                currentDate={currentDate}
                weekdays={weekdays}
                handleDateClick={handleDateClick}
                isInChallengeRange={(date) => {
                  return calendarUtils.isInChallengeRange(
                    date,
                    challenges,
                    selectedChallengeId
                  );
                }}
                CalenderclassName="sm:w-[90%]"
                selectedDate={recordDate}
              />
            </div>
          ) : (
            <div className="flex sm:justify-center sm:items-center pt-[1rem] gap-[1rem]">
              <button
                className=" p-4 drop-shadow-md hover:bg-gray-13 rounded-md border-[0.1rem]"
                onClick={handleBack}
              >
                ← 뒤로가기
              </button>
              <DateInput
                onChange={(newDate: string) => {
                  setRecordDate(newDate); // selectedDate 대신 recordDate를 업데이트

                  // 선택된 날짜에 해당하는 기록만 필터링 (Calendar와 동일한 로직 적용)
                  const filtered = allDailyMeals.filter((meal) => {
                    return (
                      meal.recordDate === newDate &&
                      new Date(meal.recordDate) >=
                        new Date(challengePeriods.start_date) &&
                      new Date(meal.recordDate) <=
                        new Date(challengePeriods.end_date)
                    );
                  });

                  setFilteredDailyMeals(filtered);
                }}
                selectedDate={recordDate}
                challengeStartDate={challengeDates.startDate}
                challengeEndDate={challengeDates.endDate}
              />
            </div>
          )}
        </div>
        {displayMeals.map((dailyMeal) => (
          <div key={dailyMeal.recordDate} className="relative mb-[2rem]">
            <h2 className="text-[1.5rem] font-bold sm:pl-[1rem] pb-[1rem]">
              {dailyMeal.recordDate}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:px-4 px-4 ">
              {(
                ['breakfast', 'lunch', 'dinner', 'snack', 'supplement'] as const
              ).map((mealType) => {
                const formatRecordDate = dailyMeal.meals[mealType]?.updatedAt
                  ? (() => {
                      const date = new Date(
                        dailyMeal.meals[mealType]?.updatedAt || ''
                      );
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(
                        2,
                        '0'
                      );
                      const day = String(date.getDate()).padStart(2, '0');
                      const hours = String(date.getHours()).padStart(2, '0');
                      const minutes = String(date.getMinutes()).padStart(
                        2,
                        '0'
                      );
                      return `최근 수정일: ${year}-${month}-${day} ${hours}:${minutes}`;
                    })()
                  : '';
                return (
                  <MealPhotoLayout
                    key={mealType}
                    title={
                      mealType === 'breakfast'
                        ? '아침'
                        : mealType === 'lunch'
                        ? '점심'
                        : mealType === 'dinner'
                        ? '저녁'
                        : mealType === 'snack'
                        ? '간식'
                        : '영양제'
                    }
                    src={dailyMeal.meals[mealType]?.mealPhotos || []}
                    descriptions={dailyMeal.meals[mealType]?.description || ''}
                    time={formatRecordDate}
                    onAddComment={() => console.log('comment area')}
                  />
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-1 px-4 mt-8 ">
              <TextBox
                title="AI 분석 결과"
                value={dailyMeal.feedbacks.ai_feedback}
                placeholder="결과생성 버튼을 눌러주세요."
                button1="생성"
                button2="복사"
                onClick2={() => handleCopy(dailyMeal.feedbacks.ai_feedback)}
                onClick1={handleGenerateAnalyse}
                readOnly={true}
                svg1="/image/createIcon.png"
                svg2="/svg/copyIcon.svg"
                Btn1className={`${
                  isDisable ? 'disabled bg-gray-1' : ''
                } bg-[#F89A1B] text-white`}
                Btn2className="text-[#F89A1B] border-[#F89A1B] border-[0.1rem]"
                copyIcon
              />

              <TextBox
                title="코치 피드백"
                value={(() => {
                  const currentValue =
                    feedbacksByDate[dailyMeal.recordDate] ||
                    dailyMeal.feedbacks.coach_feedback;
                  // console.log('TextBox value 계산:', {
                  //   date: dailyMeal.recordDate,
                  //   임시저장값: feedbacksByDate[dailyMeal.recordDate],
                  //   기존피드백: dailyMeal.feedbacks.coach_feedback,
                  //   최종표시값: currentValue,
                  // });
                  return currentValue;
                })()}
                placeholder="피드백을 작성하세요."
                button1="남기기"
                Btn1className="bg-[#48BA5D] text-white"
                svg1="/svg/send.svg"
                onChange={(e) =>
                  handleFeedbackChange(dailyMeal.recordDate, e.target.value)
                }
                onSave={async (feedback) => {
                  await handleSaveFeedback(feedback);
                }}
                isFeedbackMode={true}
                copyIcon
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
