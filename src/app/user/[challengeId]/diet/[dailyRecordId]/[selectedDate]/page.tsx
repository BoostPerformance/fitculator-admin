'use client';
import { useState, useEffect, useMemo } from 'react';
import { DietPageSkeleton } from '@/components/layout/skeleton';
import DailyDietRecordMobile from '@/components/graph/dailyDietRecordMobile';
import { useRouter } from 'next/navigation';
import TextBox from '@/components/textBox';
import Title from '@/components/layout/title';
import TotalFeedbackCounts from '@/components/totalCounts/totalFeedbackCount';
import MealPhotoLayout from '@/components/layout/mealPhotoLayout';
import { useParams } from 'next/navigation';
import Calendar from '@/components/input/calendar';
import { DailyMealData, MealItem } from '@/types/dietItemContainerTypes';
import calendarUtils from '@/components/utils/calendarUtils';
import DateInput from '@/components/input/dateInput';
import { useFeedback } from '@/components/hooks/useFeedback';
import { useChallenge } from '@/components/hooks/useChallenges';
import logger from '@/lib/logger';
import Footer from '@/components/layout/footer';

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
  selectedDate: string;
};

const DEFAULT_MEAL = {
  description: '',
  meal_photos: [],
  updatedAt: '',
  meal_time: '',
};

const DEFAULT_DAILY_MEAL = (date: string) => ({
  recordDate: date,
  meals: {
    breakfast: { ...DEFAULT_MEAL },
    lunch: { ...DEFAULT_MEAL },
    dinner: { ...DEFAULT_MEAL },
    snack: { ...DEFAULT_MEAL },
    supplement: { ...DEFAULT_MEAL },
  },
  feedbacks: {
    coach_feedback: '',
    ai_feedback: '',
  },
  user: undefined,
});

export default function SelectedDate() {
  const router = useRouter();
  const params = useParams() as PageParams;
  const { saveFeedback } = useFeedback();
  const { fetchChallenges, challenges } = useChallenge();

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [copyMessage, setCopyMessage] = useState(false);
  const [feedbacksByDate, setFeedbacksByDate] = useState<{
    [key: string]: string;
  }>({});
  const [isDisable, setIsDisable] = useState(false);
  const [challengeTitle, setChallengeTitle] = useState('');
  const [recordDate, setRecordDate] = useState(params.selectedDate || '');
  const [orgName, setOrgName] = useState({
    username: '',
    organization_name: '',
  });
  const [mobileSize, setMobileSize] = useState(true);
  const [challengePeriods, setChallengePeriods] = useState({
    start_date: '',
    end_date: '',
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dailyMeal, setDailyMeal] = useState<DailyMealData | null>(null);
  const weekdays = ['월', '화', '수', '목', '금', '토', '일'];

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 640;
      // console.log(`화면 크기 변경: ${window.innerWidth}px, 모바일=${isMobile}`);
      setMobileSize(window.innerWidth <= 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        if (
          !params.selectedDate ||
          !params.dailyRecordId ||
          !params.challengeId
        ) {
          setIsLoading(false);
          return;
        }

        // console.log(`API 호출 시작: 모바일 상태 = ${mobileSize}`);
        // console.log(
        //   `파라미터: 날짜=${params.selectedDate}, 일일기록ID=${params.dailyRecordId}`
        // );

        const response = await fetch(
          `/api/meals?date=${params.selectedDate}&dailyRecordId=${params.dailyRecordId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
            },
          }
        );
        // console.log(`API 응답 상태: ${response.status} ${response.statusText}`);

        // console.log(params);
        let data = {
          record_date: params.selectedDate,
          upload_days_count: 0,
          challenge: {
            organization: {
              name: orgName.organization_name,
            },
            title: challengeTitle || '챌린지',
            start_date: challengePeriods.start_date,
            end_date: challengePeriods.end_date,
          },
          meals: {
            breakfast: [{ ...DEFAULT_MEAL }],
            lunch: [{ ...DEFAULT_MEAL }],
            dinner: [{ ...DEFAULT_MEAL }],
            snack: [{ ...DEFAULT_MEAL }],
            supplement: [{ ...DEFAULT_MEAL }],
          },
          feedbacks: {
            coach_feedback: '',
            ai_feedback: '',
          },
          user: undefined,
        };

        if (response.ok) {
          const responseData = await response.json();

          if (responseData) {
            data = {
              ...data,
              ...responseData,
              challenge: {
                ...data.challenge,
                ...responseData.challenge,
              },
            };
            logger.debug('API Response:', responseData);
          }
          // console.log('responseData', responseData);
        } else {
          logger.error('Failed to fetch data');
        }

        if (!isMounted) {
          return;
        }

        // 조직 정보 설정
        setOrgName({
          username: '코치님',
          organization_name:
            data.challenge?.organization?.name || orgName.organization_name,
        });
        // console.log(orgName);

        // 챌린지 정보 설정
        setChallengeTitle(data.challenge?.title || '챌린지');
        setChallengePeriods({
          start_date: data.challenge?.start_date || challengePeriods.start_date,
          end_date: data.challenge?.end_date || challengePeriods.end_date,
        });

        // 식단 데이터 처리 - 중복 코드 제거
        const mealTypes = [
          'breakfast',
          'lunch',
          'dinner',
          'snack',
          'supplement',
        ] as const;

        const processedMeals: {
          breakfast: MealItem[];
          lunch: MealItem[];
          dinner: MealItem[];
          snack: MealItem[];
          supplement: MealItem[];
        } = {
          breakfast: [],
          lunch: [],
          dinner: [],
          snack: [],
          supplement: [],
        };

        mealTypes.forEach((type) => {
          processedMeals[type] = Array.isArray(data.meals?.[type])
            ? data.meals[type].map((meal: any) => ({
                ...DEFAULT_MEAL,
                description: meal?.description || '',
                meal_time: meal?.meal_time || '',
                meal_photos: (meal?.meal_photos || []).map((photo: any) => ({
                  id: photo.id || '',
                  meal_id: '',
                  photo_url: photo.url || '',
                  created_at: new Date().toISOString(),
                })),
              }))
            : [{ ...DEFAULT_MEAL }];
        });

        const processedMeal = {
          recordDate: data.record_date,
          upload_days_count: data.upload_days_count,
          meals: processedMeals,
          feedbacks: {
            coach_feedback: data.feedbacks?.coach_feedback || '',
            ai_feedback: data.feedbacks?.ai_feedback || '',
          },
          user: data.user,
        };

        logger.debug('Processed Meal:', processedMeal);
        setDailyMeal(processedMeal);

        //console.log('processedMeal', processedMeal);
      } catch (error) {
        logger.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [params.selectedDate, params.dailyRecordId, params.challengeId]);

  // 업로드 일수 계산 수정
  const metrics = useMemo(() => {
    // 챌린지 시작일과 종료일
    const startDate = challengePeriods.start_date
      ? new Date(challengePeriods.start_date)
      : new Date('2025-02-10');

    const endDate = challengePeriods.end_date
      ? new Date(challengePeriods.end_date)
      : null;

    // 챌린지 총 기간 계산 (시작일부터 종료일까지의 일수)
    const totalChallengeDays = endDate
      ? Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      : 45; // 기본값 45일

    // API에서 가져온 실제 업로드 일수 사용
    // 이 값은 유저가 실제로 업로드한 일수를 나타냄
    const uploadCount = dailyMeal?.upload_days_count || 0;
    //console.log(dailyMeal?.upload_days_count);

    return {
      // 분모: 챌린지 총 기간 (보통 45일)
      total: totalChallengeDays,
      // 분자: API에서 받아온 실제 업로드 일수
      count: uploadCount,
    };
  }, [dailyMeal, challengePeriods]);

  const handleSaveFeedback = async (feedback: string) => {
    try {
      if (!recordDate) {
        logger.error('No record date selected');
        return;
      }

      await saveFeedback({
        daily_record_id: params.dailyRecordId,
        coach_feedback: feedback,
      });

      // 상태 업데이트
      if (dailyMeal && dailyMeal.recordDate === recordDate) {
        setDailyMeal({
          ...dailyMeal,
          feedbacks: {
            ...dailyMeal.feedbacks,
            coach_feedback: feedback,
          },
        });
      }

      setFeedbacksByDate((prev) => ({
        ...prev,
        [recordDate]: feedback,
      }));

      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false);
      }, 3000);
    } catch (error) {
      logger.error('Failed to save feedback:', error);
    }
  };

  const isDateValid = (date: Date) => {
    // 현재 날짜 (한국 시간)
    const now = new Date();
    const koreaTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    koreaTime.setHours(0, 0, 0, 0);

    // 선택한 날짜가 오늘 이후인 경우
    if (date > koreaTime) {
      return false;
    }

    // 챌린지 기간 체크
    const startDate = challengePeriods.start_date
      ? new Date(challengePeriods.start_date)
      : null;
    const endDate = challengePeriods.end_date
      ? new Date(challengePeriods.end_date)
      : null;

    // console.log('챌린지 기간 체크:', {
    //   date,
    //   startDate,
    //   endDate,
    //   isBeforeStart: startDate && date < startDate,
    //   isAfterEnd: endDate && date > endDate,
    // });

    if (startDate && endDate) {
      if (date < startDate || date > endDate) {
        return false;
      }
    }

    return true;
  };

  const handleDateClick = async (date: Date) => {
    // console.log(`날짜 클릭: ${date}, 유효성=${isDateValid(date)}`);

    if (!isDateValid(date)) {
      alert('선택할 수 없는 날짜입니다.');
      return;
    }

    const formattedDate = calendarUtils.formatDate(date);
    // console.log(`형식화된 날짜: ${formattedDate}`);

    try {
      const response = await fetch(
        `/api/daily-records?date=${formattedDate}&currentDailyRecordId=${params.dailyRecordId}`
      );
      const data = await response.json();

      if (data) {
        router.push(
          `/user/${params.challengeId}/diet/${data.id}/${formattedDate}`
        );
      }
    } catch (error) {
      logger.error('Error fetching daily record:', error);
    }
  };

  const handlePrevMonth = () => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1
    );
    setCurrentDate(newDate);
  };

  const handleGenerateAnalyse = async () => {
    try {
      setIsDisable(true);

      const response = await fetch('/api/diet-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dailyRecordId: params.dailyRecordId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI feedback');
      }

      const feedback = await response.json();

      // 상태 업데이트
      if (dailyMeal && dailyMeal.recordDate === recordDate) {
        setDailyMeal({
          ...dailyMeal,
          feedbacks: {
            ...dailyMeal.feedbacks,
            ai_feedback: feedback.ai_feedback,
          },
        });
      }

      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false);
      }, 3000);
    } catch (error) {
      logger.error('Error generating AI feedback:', error);
    } finally {
      setIsDisable(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage(true);
      setShowAlert(true);
      setTimeout(() => {
        setCopyMessage(false);
        setShowAlert(false);
      }, 3000);
    } catch (err) {
      logger.error('복사 실패:', err);
    }
  };

  const handleFeedbackChange = (date: string, feedback: string) => {
    setFeedbacksByDate((prev) => ({
      ...prev,
      [date]: feedback,
    }));
  };

  const handleBack = () => {
    router.push(`/user/${params.challengeId}/diet?date=${params.selectedDate}`);
  };

  const displayMeal = useMemo(() => {
    return dailyMeal || DEFAULT_DAILY_MEAL(recordDate);
  }, [dailyMeal, recordDate]);

  if (isLoading) {
    return <DietPageSkeleton />;
  }
  //  console.log('challengePeriods.start_date', challengePeriods);

  return (
    <div>
      <div className="flex sm:flex-col md:flex-col gap-[1rem] sm:bg-[#E4E9FF] sm:dark:bg-[#181c32] sm:dark:bg-none sm:min-w-[24rem]">
        <CustomAlert
          message={
            copyMessage
              ? '복사가 완료되었습니다.'
              : isDisable
              ? '피드백 작성 중입니다...'
              : '피드백 작성이 완료되었습니다.'
          }
          isVisible={showAlert || copyMessage}
          onClose={() => {
            setShowAlert(false);
            setCopyMessage(false);
          }}
        />

        <div className="md:px-[1rem] ">
          <div className="flex-1 py-[2rem] sm:pt-0 ">
            <div className="sm:flex sm:flex-col sm:gap-4 sm:px-[1rem] max-w-[400px] ">
              <div className="flex sm:pt-[1rem]">
                <div className="text-gray-2 text-1.25-700">
                  {orgName.organization_name}&nbsp;
                </div>
                <div className="text-gray-2 text-1.25-700">
                  {challengeTitle}
                </div>
              </div>

              <Title
                title={(() => {
                  const userName = dailyMeal?.user?.name;
                  return `${userName || '사용자'}님의 식단현황`;
                })()}
              />

              <TotalFeedbackCounts
                counts={metrics.count.toString()}
                total={metrics.total.toString() + '일'}
                borderColor="border-[#FDB810]"
                textColor="text-[#FDB810]"
                title="총 식단 업로드"
              />
            </div>

            {mobileSize ? (
              <div className="flex items-center justify-center flex-col">
                <Calendar
                  handlePrevMonth={handlePrevMonth}
                  handleNextMonth={handleNextMonth}
                  currentDate={currentDate}
                  weekdays={weekdays}
                  handleDateClick={handleDateClick}
                  isInChallengeRange={(date) => {
                    const now = new Date();
                    const koreaTime = new Date(
                      now.getTime() + 9 * 60 * 60 * 1000
                    );
                    koreaTime.setHours(0, 0, 0, 0);

                    // 미래 날짜 체크
                    if (date > koreaTime) {
                      return false;
                    }

                    // 챌린지 기간 체크
                    if (
                      !challengePeriods.start_date ||
                      !challengePeriods.end_date
                    ) {
                      return false;
                    }

                    const startDate = new Date(challengePeriods.start_date);
                    const endDate = new Date(challengePeriods.end_date);
                    return date >= startDate && date <= endDate;
                  }}
                  CalenderclassName="sm:w-[90%]"
                  selectedDate={recordDate}
                />
              </div>
            ) : (
              <div className="flex sm:justify-center sm:items-center pt-[2rem] gap-[1rem]">
                <DateInput
                  onChange={async (newDate: string) => {
                    const selectedDate = new Date(newDate);
                    if (!isDateValid(selectedDate)) {
                      alert('선택할 수 없는 날짜입니다.');
                      return;
                    }

                    try {
                      const response = await fetch(
                        `/api/daily-records?date=${newDate}&currentDailyRecordId=${params.dailyRecordId}`
                      );
                      const data = await response.json();

                      if (data) {
                        router.push(
                          `/user/${params.challengeId}/diet/${data.id}/${newDate}`
                        );
                      }
                    } catch (error) {
                      logger.error('Error fetching daily record:', error);
                    }
                  }}
                  selectedDate={recordDate}
                  challengeStartDate={challengePeriods.start_date}
                  challengeEndDate={challengePeriods.end_date}
                />
              </div>
            )}
          </div>

          <div className="relative mb-[2rem]">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:px-4 px-4">
              {(
                ['breakfast', 'lunch', 'dinner', 'snack', 'supplement'] as const
              ).map((mealType) => {
                const mealItems = Array.isArray(displayMeal.meals[mealType])
                  ? displayMeal.meals[mealType]
                  : [displayMeal.meals[mealType]];

                const mealTitles = {
                  breakfast: '아침',
                  lunch: '점심',
                  dinner: '저녁',
                  snack: '간식',
                  supplement: '영양제',
                };

                return (
                  <MealPhotoLayout
                    key={mealType}
                    title={mealTitles[mealType]}
                    mealItems={mealItems}
                  />
                );
              })}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-1 px-4 mt-8">
              <TextBox
                title="AI 분석 결과"
                value={displayMeal.feedbacks.ai_feedback}
                placeholder="아직 AI 분석 진행 전 이에요."
                button2="복사"
                onClick2={() => handleCopy(displayMeal.feedbacks.ai_feedback)}
                readOnly={true}
                svg2="/svg/copyIcon-orange.svg"
                Btn2className="text-[#F89A1B] border-[#F89A1B] border-[0.1rem]"
                copyIcon
              />

              <TextBox
                title="코치 피드백"
                value={
                  feedbacksByDate[displayMeal.recordDate] !== undefined
                    ? feedbacksByDate[displayMeal.recordDate]
                    : displayMeal.feedbacks.coach_feedback || ''
                }
                placeholder="피드백을 작성하세요."
                button1="남기기"
                Btn1className="bg-green text-white"
                svg1="/svg/send.svg"
                onChange={(e) =>
                  handleFeedbackChange(displayMeal.recordDate, e.target.value)
                }
                onSave={async (feedback) => {
                  await handleSaveFeedback(feedback);
                }}
                isFeedbackMode={true}
                copyIcon
              />
            </div>
            <button
              className="mb-4 text-gray-400 font-bold hover:font-extrabold cursor-pointer sm:px-[2rem]"
              onClick={handleBack}
            >
              ← 목록으로
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
