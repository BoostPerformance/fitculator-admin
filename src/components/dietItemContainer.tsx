'use client';
import { useState, useEffect, useMemo } from 'react';
import TextBox from './textBox';
import { AI_Feedback } from './mock/DietItems';
import Title from './layout/title';
import TotalFeedbackCounts from './totalCounts/totalFeedbackCount';
import MealPhotoLayout from './layout/mealPhotoLayout';
import { useSearchParams, useParams } from 'next/navigation';
import Sidebar from './fixedBars/sidebar';
import { ProcessedMeal } from '@/types/dietDetaileTableTypes';
import Calendar from './input/calendar';
import { DailyMealData, UserData } from '@/types/dietItemContainerTypes';
import calendarUtils from './utils/calendarUtils';
import DateInput from './input/dateInput';

const getAIFeedback = (user_id: string, date: string) => {
  return AI_Feedback.find(
    (feedback) => feedback.user_id === user_id && feedback.date === date
  );
};

// const getMealByTypeAndDate = (
//   user_id: string,
//   date: string,
//   mealType: string
// ) => {
//   return meals.find(
//     (meal) =>
//       meal.user_id === user_id &&
//       meal.date === date &&
//       meal.meal_type === mealType
//   );
// };

export default function DietItemContainer() {
  const params = useParams();
  const [isDisable, setIsDisable] = useState(false);
  const [challenges, setChallenges] = useState<ProcessedMeal[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');

  const [coachFeedback, setCoachFeedback] = useState('');

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
  const emptyDailyMeal = {
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
  };
  // 달력 날짜가 변경될 때마다 해당 월의 기록만 필터링하는 함수
  const filterMealsByMonth = (date: Date) => {
    if (!challengePeriods.start_date || !challengePeriods.end_date) return;
    //console.log('Filtering for date:', date);
    //console.log('Challenge periods:', challengePeriods);
    //console.log('All meals:', allDailyMeals);

    const year = date.getFullYear();
    const month = date.getMonth();

    const filtered = allDailyMeals.filter((meal) => {
      const mealDate = new Date(meal.recordDate);

      // 챌린지 기간 내의 기록인지 확인
      const isInChallengeRange =
        new Date(meal.recordDate) >= new Date(challengePeriods.start_date) &&
        new Date(meal.recordDate) <= new Date(challengePeriods.end_date);

      // 선택된 월의 기록인지 확인
      const isInSelectedMonth =
        mealDate.getFullYear() === year && mealDate.getMonth() === month;

      const shouldInclude = isInChallengeRange && isInSelectedMonth;
      // console.log('Meal date:', meal.recordDate, 'Include?:', shouldInclude);

      return shouldInclude;
    });

    //console.log('Filtered meals:', filtered);
    setFilteredDailyMeals(filtered);
  };

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

    // console.log('Found Challenge:', selectedChallenge);

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

  const handleGenerateAnalyse = () => {
    setIsDisable(true);
    console.log('AI 결과 생성 중...');
  };

  // const handleSaveFeedback = (
  //   mealType: string,
  //   userId: string,
  //   date: string
  // ) => {
  //   const meal = meals.find(
  //     (meal) =>
  //       meal.user_id === userId &&
  //       meal.date === date &&
  //       meal.meal_type === mealType
  //   );
  //   if (meal) {
  //     meal.additional_comments = commentText[`${mealType}-${date}`] || '';
  //     console.log('피드백 저장:', meal);
  //   }
  //   setCommentVisible((prev) => {
  //     const newVisibility = { ...prev };
  //     newVisibility[`${mealType}-${date}`] = false;
  //     return newVisibility;
  //   });
  // };

  // const handleAddComment = (mealType: string) => {
  //   setCommentVisible((prev) => {
  //     const newVisibility = { ...prev };
  //     newVisibility[`${mealType}`] = !newVisibility[`${mealType}`];
  //     return newVisibility;
  //   });
  // };

  // const handleCancelComment = (mealType: string) => {
  //   setCommentVisible((prev) => {
  //     const newVisibility = { ...prev };
  //     newVisibility[`${mealType}-${date}`] = false;
  //     return newVisibility;
  //   });
  // };

  // const handleCommentChange = (
  //   mealType: string,
  //   date: string,
  //   text: string
  // ) => {
  //   setCommentText((prev) => {
  //     const newComments = { ...prev };
  //     newComments[`${mealType}-${date}`] = text;
  //     return newComments;
  //   });
  // };

  // const fetchMeals = async () => {
  //   try {
  //     const response = await fetch('/api/dietItem');
  //     const data = await response.json();
  //     setMeals(data);
  //   } catch (error) {
  //     console.error('Error fetching meals:', error);
  //   }
  // };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const mealsResponse = await fetch('/api/meals');
        const mealsData = await mealsResponse.json();

        const userMeals = mealsData.filter(
          (meal: any) =>
            meal.daily_records?.challenge_participants?.users?.id ===
            params.dailyRecordId
        );

        const mealsByDate = userMeals.reduce(
          (acc: { [key: string]: DailyMealData }, meal: any) => {
            const date = meal.daily_records.record_date;

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

        const sortedMeals = Object.values(mealsByDate).sort(
          (a: any, b: any) =>
            new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime()
        ) as DailyMealData[];

        setAllDailyMeals(sortedMeals); // 전체 기록 저장

        // 현재 월의 기록으로 필터링

        const challengesResponse = await fetch('/api/challenges');
        if (!challengesResponse.ok) {
          throw new Error('Failed to fetch challenges');
        }
        const challengeData = await challengesResponse.json();
        setChallenges(challengeData);

        const currentChallenge = challengeData.find(
          (challenge: any) => challenge.challenge_id === params.challengeId
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
      } catch (error) {
        console.log('Error fetching data:', error);
      }
    };

    fetchData();

    // window.addEventListener('scroll', handleScroll);
    // return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
  }, [challengePeriods, currentDate, allDailyMeals]);

  //console.log('challengePeriods', challengePeriods);

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCoachFeedback(e.target.value);
  };

  const currentChallengeIndex = challenges.find(
    (challenge) => challenge.challenge_id === selectedChallengeId
  );

  const challengeDates = {
    startDate: currentChallengeIndex?.challenges?.start_date || '',
    endDate: currentChallengeIndex?.challenges?.end_date || '',
  };

  const displayMeals = filteredDailyMeals.length
    ? filteredDailyMeals
    : [emptyDailyMeal];

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

  return (
    <div className=" flex sm:flex-col gap-[1rem] sm:bg-[#E4E9FF]">
      <Sidebar
        data={challenges}
        onSelectChallenge={handleChallengeSelect}
        onSelectChallengeTitle={handleChallengeSelect}
        coach={orgName.username}
      />

      <div>
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
            <div className="flex items-center justify-center ">
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
            <div className="flex sm:justify-center sm:items-center pt-[1rem]">
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
            <h2 className="text-[1.5rem] font-bold">{dailyMeal.recordDate}</h2>

            <div className="grid grid-cols-5 gap-[1rem] sm:grid-cols-1 sm:px-[1rem]">
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

            <div className="flex items-center justify-around sm:flex-col w-full">
              <TextBox
                title="AI 분석 결과"
                placeholder="결과생성 버튼을 눌러주세요."
                button1="생성"
                button2="복사"
                onClick1={handleGenerateAnalyse}
                readOnly={true}
                svg1="/image/createIcon.png"
                svg2="/svg/copyIcon.svg"
                Btn1className={`${
                  isDisable ? 'disabled bg-gray-1' : ''
                } bg-[#F89A1B] text-white`}
                Btn2className="text-[#F89A1B] border-[#F89A1B] border-[0.1rem]"
              />
              <TextBox
                title="코치 피드백"
                value={dailyMeal.feedbacks.coach_feedback}
                placeholder="피드백을 작성하세요."
                button1="남기기"
                Btn1className="bg-[#48BA5D] text-white "
                svg1="/svg/send.svg"
                onClick2={() => console.log('피드백 전송')}
                onChange={handleFeedbackChange}
                copyIcon
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
