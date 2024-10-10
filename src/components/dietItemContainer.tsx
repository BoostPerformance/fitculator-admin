'use client';
import { useState, useEffect } from 'react';
import TextBox from './textBox';
import DietItems from './mock/DietItems';
import Title from './layout/title';
import TotalFeedbackCounts from './dietDashboard/totalFeedbackCount';

const Meal = ({ title, photos, descriptions, time }: any) => {
  // 사진 개수에 따라 그리드 레이아웃을 변경
  const renderPhotos = () => {
    if (photos.length === 1) {
      return (
        <div className="w-full h-[10rem] overflow-hidden rounded-lg">
          <img
            src={`/image${photos}`}
            alt="meal"
            className="w-full h-full object-cover"
          />
        </div>
      );
    } else if (photos.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-[0.5rem]">
          {photos.map((photo: string, index: number) => (
            <div
              key={index}
              className="w-full h-[10rem] overflow-hidden rounded-lg"
            >
              <img
                src={`/image${photo}`}
                alt={`meal-${index}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      );
    } else if (photos.length === 3) {
      return (
        <div className="grid grid-cols-3 grid-rows-2 gap-[0.2rem]">
          <div className="col-span-2 row-span-2 h-full overflow-hidden rounded-lg">
            <img
              src={`/image${photos[0]}`}
              alt="meal-large"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="h-[5rem] overflow-hidden rounded-lg">
            <img
              src={`/image${photos[1]}`}
              alt="meal-small-1"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="h-[5rem] overflow-hidden rounded-lg">
            <img
              src={`/image${photos[2]}`}
              alt="meal-small-2"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      );
    } else if (photos.length === 4) {
      return (
        <div className="grid grid-cols-2 gap-[0.2rem]">
          {photos.map((photo: string, index: number) => (
            <div
              key={index}
              className="w-full h-[5rem] overflow-hidden rounded-lg"
            >
              <img
                src={`/image${photo}`}
                alt={`meal-${index}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div className="meal w-full">
      <h3 className="text-center mb-4 text-[1rem] font-semibold">{title}</h3>
      {renderPhotos()}
      <div className="text-[0.875rem] mt-2 text-gray-600">{time}</div>
      <div className="text-[0.875rem] mt-1">{descriptions}</div>
    </div>
  );
};

export default function DietItemContainer() {
  const [visibleItems, setVisibleItems] = useState(2);
  const totalFeedbackCount = DietItems.reduce(
    (total, item) => total + parseInt(item.feedback.split('/')[0], 10),
    0
  );

  const handleScroll = () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      setVisibleItems((prev) => prev + 2);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="max-w-[48rem] mx-auto z-50">
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
            <Meal
              title="아침"
              photos={item.meals.breakfast.images}
              descriptions={item.meals.breakfast.description}
              time={['08:00']}
            />
            <Meal
              title="점심"
              photos={item.meals.lunch.images}
              descriptions={item.meals.lunch.description}
              time={['12:00']}
            />
            <Meal
              title="저녁"
              photos={item.meals.dinner.images}
              descriptions={item.meals.dinner.description}
              time={['18:00']}
            />
            <Meal
              title="간식"
              photos={item.meals.snack.images}
              descriptions={item.meals.snack.description}
              time={['16:00']}
            />
          </div>
          <TextBox
            title="AI 분석 결과"
            copyicon="🔍"
            content={item.aiAnalysis}
            inputbox="피드백을 작성하세요"
            button1="결과생성"
          />
          <TextBox
            title="코치 피드백"
            copyicon="✍️"
            inputbox="피드백을 작성하세요"
            button1="제출"
            button2="복사"
          />
        </div>
      ))}
    </div>
  );
}
