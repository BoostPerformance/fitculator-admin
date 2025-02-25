"use client";
import { useState, useEffect, useMemo } from "react";
import { DietPageSkeleton } from "@/components/layout/skeleton";
import DailyDietRecordMobile from "@/components/graph/dailyDietRecordMobile";
import { useRouter } from "next/navigation";
import TextBox from "@/components/textBox";
import Title from "@/components/layout/title";
import TotalFeedbackCounts from "@/components/totalCounts/totalFeedbackCount";
import MealPhotoLayout from "@/components/layout/mealPhotoLayout";
import { useParams } from "next/navigation";
import Calendar from "@/components/input/calendar";
import { DailyMealData } from "@/types/dietItemContainerTypes";
import calendarUtils from "@/components/utils/calendarUtils";
import DateInput from "@/components/input/dateInput";
import { useFeedback } from "@/components/hooks/useFeedback";
import { useChallenge } from "@/components/hooks/useChallenges";

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
  description: "",
  meal_photos: [],
  updatedAt: "",
  meal_time: "",
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
    coach_feedback: "",
    ai_feedback: "",
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
  const [challengeTitle, setChallengeTitle] = useState("");
  const [recordDate, setRecordDate] = useState(params.selectedDate || "");
  const [orgName, setOrgName] = useState({
    username: "코치님",
    organization_name: "F45 을지로 챌린지",
  });
  const [mobileSize, setMobileSize] = useState(true);
  const [challengePeriods, setChallengePeriods] = useState({
    start_date: "",
    end_date: "",
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allDailyMeals, setAllDailyMeals] = useState<DailyMealData[]>([]);
  const [filteredDailyMeals, setFilteredDailyMeals] = useState<DailyMealData[]>(
    []
  );
  const weekdays = ["월", "화", "수", "목", "금", "토", "일"];

  useEffect(() => {
    const handleResize = () => setMobileSize(window.innerWidth <= 640);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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

        const response = await fetch(
          `/api/meals?date=${params.selectedDate}&dailyRecordId=${params.dailyRecordId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
            },
          }
        );

        let data = {
          record_date: params.selectedDate,
          upload_days_count: 0,
          challenge: {
            organization: {
              name: orgName.organization_name,
            },
            title: challengeTitle || "챌린지",
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
            coach_feedback: "",
            ai_feedback: "",
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
            console.log("API Response:", responseData);
          }
        } else {
          console.error("Failed to fetch data");
        }

        if (!isMounted) {
          return;
        }

        // 조직 정보 설정
        setOrgName({
          username: "코치님",
          organization_name:
            data.challenge?.organization?.name || orgName.organization_name,
        });

        // 챌린지 정보 설정
        setChallengeTitle(data.challenge?.title || "챌린지");
        setChallengePeriods({
          start_date: data.challenge?.start_date || challengePeriods.start_date,
          end_date: data.challenge?.end_date || challengePeriods.end_date,
        });

        // 식단 데이터 처리
        const processedMeal = {
          recordDate: data.record_date,
          upload_days_count: data.upload_days_count,
          meals: {
            breakfast: {
              ...DEFAULT_MEAL,
              description: data.meals?.breakfast?.[0]?.description || "",
              meal_time: data.meals?.breakfast?.[0]?.meal_time || "",
              meal_photos: (data.meals?.breakfast?.[0]?.meal_photos || []).map(
                (photo: any) => ({
                  id: photo.id || "",
                  meal_id: "",
                  photo_url: photo.url || "",
                  created_at: new Date().toISOString(),
                })
              ),
            },
            lunch: {
              ...DEFAULT_MEAL,
              description: data.meals?.lunch?.[0]?.description || "",
              meal_time: data.meals?.lunch?.[0]?.meal_time || "",
              meal_photos: (data.meals?.lunch?.[0]?.meal_photos || []).map(
                (photo: any) => ({
                  id: photo.id || "",
                  meal_id: "",
                  photo_url: photo.url || "",
                  created_at: new Date().toISOString(),
                })
              ),
            },
            dinner: {
              ...DEFAULT_MEAL,
              description: data.meals?.dinner?.[0]?.description || "",
              meal_time: data.meals?.dinner?.[0]?.meal_time || "",
              meal_photos: (data.meals?.dinner?.[0]?.meal_photos || []).map(
                (photo: any) => ({
                  id: photo.id || "",
                  meal_id: "",
                  photo_url: photo.url || "",
                  created_at: new Date().toISOString(),
                })
              ),
            },
            snack: {
              ...DEFAULT_MEAL,
              description: data.meals?.snack?.[0]?.description || "",
              meal_time: data.meals?.snack?.[0]?.meal_time || "",
              meal_photos: (data.meals?.snack?.[0]?.meal_photos || []).map(
                (photo: any) => ({
                  id: photo.id || "",
                  meal_id: "",
                  photo_url: photo.url || "",
                  created_at: new Date().toISOString(),
                })
              ),
            },
            supplement: {
              ...DEFAULT_MEAL,
              description: data.meals?.supplement?.[0]?.description || "",
              meal_time: data.meals?.supplement?.[0]?.meal_time || "",
              meal_photos: (data.meals?.supplement?.[0]?.meal_photos || []).map(
                (photo: any) => ({
                  id: photo.id || "",
                  meal_id: "",
                  photo_url: photo.url || "",
                  created_at: new Date().toISOString(),
                })
              ),
            },
          },
          feedbacks: {
            coach_feedback: data.feedbacks?.coach_feedback || "",
            ai_feedback: data.feedbacks?.ai_feedback || "",
          },
          user: data.user,
        };

        console.log("Processed Meal:", processedMeal);
        setAllDailyMeals([processedMeal]);
        setFilteredDailyMeals([processedMeal]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [params.selectedDate, params.dailyRecordId, params.challengeId]);

  const metrics = useMemo(() => {
    const startDate = new Date("2025-02-10");
    const today = new Date();
    const koreanToday = new Date(today.getTime() + 9 * 60 * 60 * 1000); // UTC+9 변환

    const totalDays = Math.ceil(
      (koreanToday.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // API response의 upload_days_count 사용
    const uploadCount = filteredDailyMeals[0]?.upload_days_count || 0;

    return {
      total: totalDays,
      count: uploadCount,
    };
  }, [filteredDailyMeals]);

  const handleSaveFeedback = async (feedback: string) => {
    try {
      if (!recordDate) {
        console.error("No record date selected");
        return;
      }

      await saveFeedback({
        daily_record_id: params.dailyRecordId,
        coach_feedback: feedback,
      });

      // 상태 업데이트
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

      setAllDailyMeals(updatedAllMeals);
      setFilteredDailyMeals(updatedAllMeals);

      setFeedbacksByDate((prev) => ({
        ...prev,
        [recordDate]: feedback,
      }));

      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to save feedback:", error);
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

    if (startDate && endDate) {
      if (date < startDate || date > endDate) {
        return false;
      }
    }

    return true;
  };

  const handleDateClick = async (date: Date) => {
    if (!isDateValid(date)) {
      alert("선택할 수 없는 날짜입니다.");
      return;
    }

    const formattedDate = calendarUtils.formatDate(date);

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
      console.error("Error fetching daily record:", error);
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

      const response = await fetch("/api/diet-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dailyRecordId: params.dailyRecordId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate AI feedback");
      }

      const feedback = await response.json();

      // 상태 업데이트
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
      setFilteredDailyMeals(updatedAllMeals);

      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false);
      }, 3000);
    } catch (error) {
      console.error("Error generating AI feedback:", error);
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
      console.error("복사 실패:", err);
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

  const displayMeals = useMemo(() => {
    if (filteredDailyMeals.length > 0) {
      return filteredDailyMeals;
    }
    return [DEFAULT_DAILY_MEAL(recordDate)];
  }, [filteredDailyMeals, recordDate]);

  if (isLoading) {
    return <DietPageSkeleton />;
  }

  return (
    <div className="flex sm:flex-col md:flex-col gap-[1rem] sm:bg-[#E4E9FF] sm:min-w-[24rem]">
      <CustomAlert
        message={
          copyMessage
            ? "복사가 완료되었습니다."
            : isDisable
            ? "피드백 작성 중입니다..."
            : "피드백 작성이 완료되었습니다."
        }
        isVisible={showAlert || copyMessage}
        onClose={() => {
          setShowAlert(false);
          setCopyMessage(false);
        }}
      />

      <div className="md:px-[1rem]">
        <div className="flex-1 py-[2rem] sm:pt-[0rem]">
          <div className="sm:px-[1rem] max-w-[400px]">
            <button
              className="mb-4 text-gray-400 font-bold hover:font-extrabold cursor-pointer"
              onClick={handleBack}
            >
              ← 목록으로
            </button>
            <div className="flex">
              <div className="text-gray-2 text-1.25-700">
                {orgName.organization_name}&nbsp;
              </div>
              <div className="text-gray-2 text-1.25-700">{challengeTitle}</div>
            </div>

            <Title
              title={(() => {
                const userName = filteredDailyMeals[0]?.user?.name;
                return `${userName || "사용자"}님의 식단현황`;
              })()}
            />
            <TotalFeedbackCounts
              counts={metrics.count.toString()}
              total={metrics.total.toString() + "일"}
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
                    alert("선택할 수 없는 날짜입니다.");
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
                    console.error("Error fetching daily record:", error);
                  }
                }}
                selectedDate={recordDate}
                challengeStartDate={challengePeriods.start_date}
                challengeEndDate={challengePeriods.end_date}
              />
            </div>
          )}
        </div>

        {displayMeals.map((dailyMeal) => (
          <div key={dailyMeal.recordDate} className="relative mb-[2rem]">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:px-4 px-4">
              {(
                ["breakfast", "lunch", "dinner", "snack", "supplement"] as const
              ).map((mealType) => {
                const formatRecordDate = dailyMeal.meals[mealType]?.meal_time
                  ? (() => {
                      const utcDate = new Date(
                        dailyMeal.meals[mealType]?.meal_time || ""
                      );
                      const date = new Date(utcDate.getTime());

                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(
                        2,
                        "0"
                      );
                      const day = String(date.getDate()).padStart(2, "0");
                      const hours = String(date.getHours()).padStart(2, "0");
                      const minutes = String(date.getMinutes()).padStart(
                        2,
                        "0"
                      );

                      return `식사 시간: ${year}-${month}-${day} ${hours}:${minutes}`;
                    })()
                  : "";

                return (
                  <MealPhotoLayout
                    key={mealType}
                    title={
                      mealType === "breakfast"
                        ? "아침"
                        : mealType === "lunch"
                        ? "점심"
                        : mealType === "dinner"
                        ? "저녁"
                        : mealType === "snack"
                        ? "간식"
                        : "영양제"
                    }
                    src={dailyMeal.meals[mealType]?.meal_photos || []}
                    descriptions={dailyMeal.meals[mealType]?.description || ""}
                    time={formatRecordDate}
                    onAddComment={() => console.log("comment area")}
                  />
                );
              })}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-1 px-4 mt-8">
              <TextBox
                title="AI 분석 결과"
                value={dailyMeal.feedbacks.ai_feedback}
                placeholder="아직 AI 분석 진행 전 이에요."
                button2="복사"
                onClick2={() => handleCopy(dailyMeal.feedbacks.ai_feedback)}
                readOnly={true}
                svg2="/svg/copyIcon.svg"
                Btn2className="text-[#F89A1B] border-[#F89A1B] border-[0.1rem]"
                copyIcon
              />

              <TextBox
                title="코치 피드백"
                value={
                  feedbacksByDate[dailyMeal.recordDate] !== undefined
                    ? feedbacksByDate[dailyMeal.recordDate]
                    : dailyMeal.feedbacks.coach_feedback || ""
                }
                placeholder="피드백을 작성하세요."
                button1="남기기"
                Btn1className="bg-[#BDBDBD] text-white"
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
