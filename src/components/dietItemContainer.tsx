'use client';
import { useState, useEffect } from 'react';
import TextBox from './textBox';
import DietItems from './mock/DietItems';
import Title from './layout/title';
import TotalFeedbackCounts from './dietDashboard/totalFeedbackCount';
import MealPhotoLayout from './layout/mealPhotoLayout';

export default function DietItemContainer() {
  const [visibleItems, setVisibleItems] = useState(2);
  const totalFeedbackCount = DietItems.reduce(
    (total, item) => total + parseInt(item.feedback.split('/')[0], 10),
    0
  );
  const [isDisable, setIsDisable] = useState(false);

  const handleScroll = () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      setVisibleItems((prev) => prev + 2);
    }
  };

  const handleGenerateAnalyse = () => {
    setIsDisable(true);
  };

  const handleCopy = (textareaId: string) => {
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
    console.log(textarea);
    if (textarea) {
      textarea.select();
      document.execCommand('copy');
      alert('복사되었습니다.');
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="max-w-[48rem] mx-auto z-50 sm:px-[3rem]">
      <div className="flex-1 py-[3rem]">
        <Title title="회원1 님의 식단현황" />
        <TotalFeedbackCounts count={totalFeedbackCount.toString()} total="30" />
      </div>

      {DietItems.slice(0, visibleItems).map((item, index) => (
        <div key={index} className=" mb-[2rem]">
          <h2 className="text-[1.5rem] font-bold">
            {item.createdAt.split('T')[0]}
          </h2>
          <div className="grid grid-cols-4 gap-[1rem]">
            <MealPhotoLayout
              title="아침"
              photos={item.meals.breakfast.images}
              descriptions={item.meals.breakfast.description}
              time={['08:00']}
            />
            <MealPhotoLayout
              title="점심"
              photos={item.meals.lunch.images}
              descriptions={item.meals.lunch.description}
              time={['12:00']}
            />
            <MealPhotoLayout
              title="저녁"
              photos={item.meals.dinner.images}
              descriptions={item.meals.dinner.description}
              time={['18:00']}
            />
            <MealPhotoLayout
              title="간식"
              photos={item.meals.snack.images}
              descriptions={item.meals.snack.description}
              time={['16:00']}
            />
          </div>

          {/* AI 분석 결과 박스는 읽기 전용으로 설정 */}
          <TextBox
            title="AI 분석 결과"
            content={item.aiAnalysis}
            inputbox="결과생성 버튼을 눌러주세요."
            button1="결과생성"
            onClickAIGenerate={() => console.log('AI 결과 생성')}
            readOnly={true}
            className={`${isDisable ? 'disabled bg-gray-1' : ''}`}
          />

          <TextBox
            title="코치 피드백"
            inputbox="피드백을 작성하세요."
            button1="저장"
            button2="복사"
            onSendFeedback={() => console.log('피드백 저장')}
          />
        </div>
      ))}
    </div>
  );
}
