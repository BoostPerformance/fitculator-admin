'use client';
import { useState, useEffect } from 'react';
import TextBox from './textBox';
import { Meals, AI_Feedback } from './mock/DietItems';
import Title from './layout/title';
import TotalFeedbackCounts from './dietDashboard/totalFeedbackCount';
import MealPhotoLayout from './layout/mealPhotoLayout';

const getAIFeedback = (user_id: string, date: string) => {
  return AI_Feedback.find(
    (feedback) => feedback.user_id === user_id && feedback.date === date
  );
};

const getMealByTypeAndDate = (
  user_id: string,
  date: string,
  mealType: string
) => {
  return Meals.find(
    (meal) =>
      meal.user_id === user_id &&
      meal.date === date &&
      meal.meal_type === mealType
  );
};

export default function DietItemContainer() {
  const [visibleItems, setVisibleItems] = useState(2);
  const [isDisable, setIsDisable] = useState(false);

  // Meal 타입별로 코멘트 관리
  const [commentVisible, setCommentVisible] = useState<{
    [key: string]: boolean;
  }>({});
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});

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
    const meal = getMealByTypeAndDate(userId, date, mealType);

    if (meal) {
      meal.additional_comments = commentText[`${mealType}-${date}`] || ''; //
      console.log('피드백 저장:', meal);
    }
    setCommentVisible((prev) => {
      const newVisibility = { ...prev };
      newVisibility[`${mealType}-${date}`] = false;
      return newVisibility;
    });
  };

  // 코멘트 추가 핸들러
  const handleAddComment = (mealType: string, date: string) => {
    setCommentVisible((prev) => {
      const newVisibility = { ...prev };
      newVisibility[`${mealType}-${date}`] =
        !newVisibility[`${mealType}-${date}`];
      return newVisibility;
    });
  };

  const handleCancelComment = (mealType: string, date: string) => {
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

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="max-w-[48rem] mx-auto z-50 sm:px-[3rem]">
      <div className="flex-1 py-[3rem]">
        <Title title="회원1 님의 식단현황" />
        <TotalFeedbackCounts count="30" total="30" />
      </div>

      {Meals.slice(0, visibleItems).map((item, index) => {
        const aiFeedback = getAIFeedback(item.user_id, item.date);

        return (
          <div key={item.meal_id} className="relative mb-[2rem]">
            <h2 className="text-[1.5rem] font-bold">{item.date}</h2>

            <div className="grid grid-cols-4 gap-[1rem]">
              <MealPhotoLayout
                title="아침"
                photos={[
                  item.image_url_1,
                  item.image_url_2,
                  item.image_url_3,
                  item.image_url_4,
                ].filter(Boolean)}
                descriptions={
                  item.meal_type === 'BREAKFAST' && item.description
                }
                time={item.updated_at.split('T')[1]}
                onAddComment={() => handleAddComment('BREAKFAST', item.date)}
              />
              <MealPhotoLayout
                title="점심"
                photos={[
                  item.image_url_1,
                  item.image_url_2,
                  item.image_url_3,
                  item.image_url_4,
                ]}
                descriptions={item.meal_type === 'LUNCH' && item.description}
                time={item.updated_at.split('T')[1]}
                onAddComment={() => handleAddComment('LUNCH', item.date)}
              />
              <MealPhotoLayout
                title="저녁"
                photos={[
                  item.image_url_1,
                  item.image_url_2,
                  item.image_url_3,
                  item.image_url_4,
                ]}
                descriptions={item.meal_type === 'DINNER' && item.description}
                time={item.updated_at.split('T')[1]}
                onAddComment={() => handleAddComment('DINNER', item.date)}
              />
              <MealPhotoLayout
                title="간식"
                photos={[
                  item.image_url_1,
                  item.image_url_2,
                  item.image_url_3,
                  item.image_url_4,
                ]}
                descriptions={item.meal_type === 'SNACK' && item.description}
                time={item.updated_at.split('T')[1]}
                onAddComment={() => handleAddComment('SNACK', item.date)}
              />
            </div>

            {/* 코멘트 텍스트 박스 (Meal 타입별로 관리) */}
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
                    onModalClose={() =>
                      handleCancelComment(mealType, item.date)
                    }
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
