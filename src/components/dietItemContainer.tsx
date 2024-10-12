'use client';
import { useState, useEffect } from 'react';
import TextBox from './textBox';
import { Meals, AI_Feedback } from './mock/DietItems';
import Title from './layout/title';
import TotalFeedbackCounts from './dietDashboard/totalFeedbackCount';
import MealPhotoLayout from './layout/mealPhotoLayout';

interface Meal {
  description: string;
  images: string[];
}

interface DietItem {
  id: number;
  discordId: string;
  name: string;
  restingHeartRate: number;
  meals: {
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
    snack: Meal;
  };
  createdAt: string;
  updatedAt: string;
  aiAnalysis: string;
  coachFeedback: string;
  feedback: string;
}

const getAIFeedback = (user_id: string, date: string) => {
  return AI_Feedback.find(
    (feedback) => feedback.user_id === user_id && feedback.date === date
  );
};

export default function DietItemContainer() {
  const [visibleItems, setVisibleItems] = useState(2);
  // const totalFeedbackCount = DietItems.reduce(
  //   (total, item) => total + parseInt(item.feedback.split('/')[0], 10),
  //   0
  // );
  const [isDisable, setIsDisable] = useState(false);

  const [commentVisible, setCommentVisible] = useState<boolean[]>(
    Array(Meals.length).fill(false)
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
  const handleSaveFeedback = () => {
    console.log('피드백 저장 중...');
  };

  const handleAddComment = (index: number) => {
    setCommentVisible((prev) => {
      const newVisibility = [...prev];
      newVisibility[index] = !newVisibility[index];
      console.log();
      return newVisibility;
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
        // 각 meal의 user_id와 date를 사용해 AI 피드백을 가져옴
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
                descriptions={item.meal_type}
                time={item.updated_at.split('T')[1]}
                onAddComment={() => handleAddComment(index)}
              />
              <MealPhotoLayout
                title="점심"
                photos={[
                  item.image_url_1,
                  item.image_url_2,
                  item.image_url_3,
                  item.image_url_4,
                ]}
                descriptions={item.meal_type}
                time={item.updated_at.split('T')[1]}
                onAddComment={() => handleAddComment(index)}
              />
              <MealPhotoLayout
                title="저녁"
                photos={[
                  item.image_url_1,
                  item.image_url_2,
                  item.image_url_3,
                  item.image_url_4,
                ]}
                descriptions={item.meal_type}
                time={item.updated_at.split('T')[1]}
                onAddComment={() => handleAddComment(index)}
              />
              <MealPhotoLayout
                title="간식"
                photos={[
                  item.image_url_1,
                  item.image_url_2,
                  item.image_url_3,
                  item.image_url_4,
                ]}
                descriptions={item.meal_type}
                time={item.updated_at.split('T')[1]}
                onAddComment={() => handleAddComment(index)}
              />
            </div>

            {/* 코멘트 텍스트 박스 (모달 형식으로 표시) */}
            {commentVisible[index] && (
              <TextBox
                title={item.meal_type}
                inputbox="코멘트를 입력하세요."
                button1="저장"
                button2="취소"
                onModalClick={() => console.log('코멘트 저장')}
                onModalClose={() => console.log('코멘트 취소')}
                isModal
              />
            )}

            {/* AI 분석 결과가 있을 때만 TextBox를 렌더링 */}
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

            <TextBox
              title="코치 피드백"
              inputbox="피드백을 작성하세요."
              button1="저장"
              button2="복사"
              onClick1={handleSaveFeedback}
              onClick2={() => console.log('피드백 전송')}
            />
          </div>
        );
      })}
    </div>
  );
}
