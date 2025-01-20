'use client';
import { useState, useEffect } from 'react';
import TextBox from './textBox';
import { AI_Feedback } from './mock/DietItems';
import Title from './layout/title';
import TotalFeedbackCounts from './totalCounts/totalFeedbackCount';
import MealPhotoLayout from './layout/mealPhotoLayout';
import { useParams } from 'next/navigation';

interface Meal {
  meal_id: string;
  user_id: string;
  date: string;
  meal_type: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  description: string;
  image_url_1?: string;
  image_url_2?: string;
  image_url_3?: string;
  image_url_4?: string;
  updated_at: string;
  additional_comments?: string;
}

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
  const [visibleItems, setVisibleItems] = useState(2);
  const [isDisable, setIsDisable] = useState(false);
  const [meals, setMeals] = useState<Meal[]>([]);

  const [commentVisible, setCommentVisible] = useState<{
    [key: string]: boolean;
  }>({});
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const { userId, date } = useParams();

  const userMeals = meals.filter(
    (meal) => meal.user_id === userId && meal.date === date
  );

  const handleScroll = () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      setVisibleItems((prev) => prev + 2);
    }
  };

  const handleGenerateAnalyse = () => {
    setIsDisable(true);
    console.log('AI 결과 생성 중...');
  };

  const handleSaveFeedback = (
    mealType: string,
    userId: string,
    date: string
  ) => {
    const meal = meals.find(
      (meal) =>
        meal.user_id === userId &&
        meal.date === date &&
        meal.meal_type === mealType
    );
    if (meal) {
      meal.additional_comments = commentText[`${mealType}-${date}`] || '';
      console.log('피드백 저장:', meal);
    }
    setCommentVisible((prev) => {
      const newVisibility = { ...prev };
      newVisibility[`${mealType}-${date}`] = false;
      return newVisibility;
    });
  };

  const handleAddComment = (mealType: string) => {
    setCommentVisible((prev) => {
      const newVisibility = { ...prev };
      newVisibility[`${mealType}`] = !newVisibility[`${mealType}`];
      return newVisibility;
    });
  };

  const handleCancelComment = (mealType: string) => {
    setCommentVisible((prev) => {
      const newVisibility = { ...prev };
      newVisibility[`${mealType}-${date}`] = false;
      return newVisibility;
    });
  };

  const handleCommentChange = (
    mealType: string,
    date: string,
    text: string
  ) => {
    setCommentText((prev) => {
      const newComments = { ...prev };
      newComments[`${mealType}-${date}`] = text;
      return newComments;
    });
  };

  const fetchMeals = async () => {
    try {
      const response = await fetch('/api/dietItem');
      const data = await response.json();
      setMeals(data);
    } catch (error) {
      console.error('Error fetching meals:', error);
    }
  };

  useEffect(() => {
    fetchMeals();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const mealData: {
    BREAKFAST: Meal | undefined;
    LUNCH: Meal | undefined;
    DINNER: Meal | undefined;
    SNACK: Meal | undefined;
  } = {
    BREAKFAST: userMeals.find((meal) => meal.meal_type === 'BREAKFAST'),
    LUNCH: userMeals.find((meal) => meal.meal_type === 'LUNCH'),
    DINNER: userMeals.find((meal) => meal.meal_type === 'DINNER'),
    SNACK: userMeals.find((meal) => meal.meal_type === 'SNACK'),
  };

  return (
    <div className="max-w-[48rem] mx-auto z-50 sm:px-[3rem] mt-[4rem]">
      <div className="flex-1 py-[3rem]">
        <Title title={`회원 ${userId}님의 ${date} 식단`} />
        <TotalFeedbackCounts count="30" total="30" />
      </div>

      {userMeals.slice(0, visibleItems).map((item) => {
        const aiFeedback = getAIFeedback(item.user_id, item.date);

        return (
          <div key={item.meal_id} className="relative mb-[2rem]">
            <h2 className="text-[1.5rem] font-bold">{item.date}</h2>

            <div className="grid grid-cols-4 gap-[1rem]">
              {(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const).map(
                (mealType) => (
                  <MealPhotoLayout
                    key={mealType}
                    title={
                      mealType === 'BREAKFAST'
                        ? '아침'
                        : mealType === 'LUNCH'
                        ? '점심'
                        : mealType === 'DINNER'
                        ? '저녁'
                        : '간식'
                    }
                    photos={
                      mealData[mealType]?.image_url_1
                        ? [
                            mealData[mealType].image_url_1,
                            mealData[mealType].image_url_2,
                            mealData[mealType].image_url_3,
                            mealData[mealType].image_url_4,
                          ].filter(Boolean)
                        : []
                    }
                    descriptions={mealData[mealType]?.description || ''}
                    time={mealData[mealType]?.updated_at.split('T')[1] || ''}
                    onAddComment={() => handleAddComment(mealType)}
                  />
                )
              )}
            </div>

            {['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'].map(
              (mealType) =>
                commentVisible[`${mealType}-${item.date}`] && (
                  <TextBox
                    key={`${mealType}-${item.date}`}
                    title={`${mealType} 코멘트`}
                    inputbox="코멘트를 입력하세요."
                    button1="저장"
                    button2="취소"
                    onModalClick={() =>
                      handleSaveFeedback(mealType, item.user_id, item.date)
                    }
                    onModalClose={() => handleCancelComment(mealType)}
                    isModal
                    onChange={(e) =>
                      handleCommentChange(mealType, item.date, e.target.value)
                    }
                  />
                )
            )}

            {/* AI 분석 결과 */}
            {aiFeedback && (
              <TextBox
                title="AI 분석 결과"
                content={aiFeedback.ai_feedback_text}
                inputbox="결과생성 버튼을 눌러주세요."
                button1="결과생성"
                onClick1={handleGenerateAnalyse}
                readOnly={true}
                className={`${isDisable ? 'disabled bg-gray-1' : ''}`}
              />
            )}

            {/* 코치 피드백 */}
            <TextBox
              title="코치 피드백"
              inputbox="피드백을 작성하세요."
              button1="저장"
              button2="복사"
              onClick1={() =>
                handleSaveFeedback('COACH_FEEDBACK', item.user_id, item.date)
              }
              onClick2={() => console.log('피드백 전송')}
            />
          </div>
        );
      })}
    </div>
  );
}
