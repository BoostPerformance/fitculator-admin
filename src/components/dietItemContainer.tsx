'use client';
import { useState, useEffect } from 'react';
import TextBox from './textBox';
import { AI_Feedback } from './mock/DietItems';
import Title from './layout/title';
import TotalFeedbackCounts from './totalCounts/totalFeedbackCount';
import MealPhotoLayout from './layout/mealPhotoLayout';
import { useParams } from 'next/navigation';
import Sidebar from './fixedBars/sidebar';
import { ProcessedMeal } from '@/types/dietDetaileTableTypes';

interface DailyRecords {
  id: string;
  feedbacks: {
    coach_feedback: string;
    ai_feedback?: string;
  };
  record_date: string;
}

interface UserData {
  challenge: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
  };
  daily_records: DailyRecords[];
  id: string;
  users: {
    display_name: string;
    id: string;
    name: string;
  };
}
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
  const params = useParams();
  const [visibleItems, setVisibleItems] = useState(2);
  const [isDisable, setIsDisable] = useState(false);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [challenges, setChallenges] = useState<ProcessedMeal[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [challengeTitle, setChallengeTitle] = useState('');

  const [userData, setUserData] = useState({
    name: '',
    display_name: '',
  });
  const [orgName, setOrgName] = useState({
    display_name: '',
    organization_name: '',
  });
  const [commentVisible, setCommentVisible] = useState<{
    [key: string]: boolean;
  }>({});
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const { userId, date } = useParams();

  const handleChallengeSelect = (challengeId: string) => {
    //console.log('Selected ID:', challengeId);

    const selectedChallenge = challenges.find(
      (challenge) => challenge.challenges.id === challengeId
    );

    // console.log('Found Challenge:', selectedChallenge);

    if (selectedChallenge) {
      setSelectedChallengeId(challengeId);
      setChallengeTitle(selectedChallenge.challenges.title);
      //console.log('Setting title to:', selectedChallenge.challenges.title);
    }
  };

  const userMeals = meals.filter(
    (meal) => meal.user_id === userId && meal.date === date
  );

  // const handleScroll = () => {
  //   if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
  //     setVisibleItems((prev) => prev + 2);
  //   }
  // };

  // const handleGenerateAnalyse = () => {
  //   setIsDisable(true);
  //   console.log('AI 결과 생성 중...');
  // };

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
          setSelectedChallengeId(currentChallenge.challenges.id);
          setChallengeTitle(currentChallenge.challenges.title);
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
            name: currentUser.users.name,
            display_name: currentUser.users.display_name,
          });
        }

        const orgDataResponse = await fetch('/api/coach-info');
        const orgData = await orgDataResponse.json();
        setOrgName(orgData);
        // const mealsResponse = await fetch('/api/meals');
        // const mealsData = await mealsResponse.json();
        // setMeals(mealsData);
      } catch (error) {
        console.log('Error fetching data:', error);
      }
    };

    fetchData();
    // fetchMeals();

    // window.addEventListener('scroll', handleScroll);
    // return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // const mealData: {
  //   BREAKFAST: Meal | undefined;
  //   LUNCH: Meal | undefined;
  //   DINNER: Meal | undefined;
  //   SNACK: Meal | undefined;
  // } = {
  //   BREAKFAST: userMeals.find((meal) => meal.meal_type === 'BREAKFAST'),
  //   LUNCH: userMeals.find((meal) => meal.meal_type === 'LUNCH'),
  //   DINNER: userMeals.find((meal) => meal.meal_type === 'DINNER'),
  //   SNACK: userMeals.find((meal) => meal.meal_type === 'SNACK'),
  // };

  return (
    <div className=" flex gap-[1rem]">
      <Sidebar
        data={challenges}
        onSelectChallenge={handleChallengeSelect}
        onSelectChallengeTitle={handleChallengeSelect}
        coach={orgName.display_name}
      />
      <div>
        <div className="flex-1 py-[3rem]">
          <div className=" flex">
            <div className="text-gray-2 text-1.25-700">
              {orgName.organization_name}&nbsp;
            </div>
            <div className="text-gray-2 text-1.25-700">{challengeTitle}</div>
          </div>
          <Title title={`${userData.name}님의 식단현황`} />
          <TotalFeedbackCounts
            counts="tody"
            total="chal"
            borderColor="border-[#FDB810]"
            textColor="text-[#FDB810]"
            title="총 식단 업로드"
          />
        </div>

        {/* {userMeals.slice(0, visibleItems).map((item) => {
        const aiFeedback = getAIFeedback(item.user_id, item.date);

        return ( */}
        <div className="relative mb-[2rem]">
          <h2 className="text-[1.5rem] font-bold">YYYY-MM-DD</h2>

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
                  photos={[
                    '/image/food.png',
                    '/image/food.png',
                    '/image/food.png',
                    '/image/food.png',
                  ]}
                  descriptions={''}
                  time={''}
                  onAddComment={() => console.log('comment area')}
                />
              )
            )}
          </div>
          <div className="flex items-center justify-around ">
            {/* {['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'].map(
          (mealType) =>
            commentVisible[`${mealType}-${item.date}`] && ( */}
            <TextBox
              title={`코멘트`}
              inputbox="코멘트를 입력하세요."
              button1="저장"
              button2="취소"
              onModalClick={
                () => console.log('click')
                // handleSaveFeedback(mealType, item.user_id, item.date)
              }
              className=""
            />
            {/* )
        )} */}

            {/* AI 분석 결과 */}
            {/* {aiFeedback && (
              <TextBox
                title="AI 분석 결과"
                content={aiFeedback.ai_feedback_text}
                inputbox="결과생성 버튼을 눌러주세요."
                button1="결과생성"
                onClick1={handleGenerateAnalyse}
                readOnly={true}
                className={`${isDisable ? 'disabled bg-gray-1' : ''}`}
              />
            )} */}

            {/* 코치 피드백 */}
            <TextBox
              title="코치 피드백"
              inputbox="피드백을 작성하세요."
              button1="저장"
              button2="복사"
              onClick2={() => console.log('피드백 전송')}
            />
          </div>
        </div>
        {/* );
      })} */}
      </div>
    </div>
  );
}
