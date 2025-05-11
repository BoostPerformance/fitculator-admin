'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import TextBox from '@/components/textBox';
import TotalFeedbackCounts from '@/components/totalCounts/totalFeedbackCount';
import WeeklyWorkoutChart from '@/components/workoutDashboard/weeklyWorkoutChart';

// 도넛 차트 SVG 생성 함수
const generateDonutChart = (workoutTypes) => {
  const total = Object.values(workoutTypes).reduce(
    (sum, value) => sum + value,
    0
  );
  let offset = 0;
  const circumference = 283; // 2 * Math.PI * 45
  const colors = {
    HIT: '#60BDFF',
    일반기기: '#90EFA5',
    걷기: '#9BA3FF',
    러닝: '#FFB6C1',
    수영: '#FFD700',
  };

  // 애니메이션 없이 도넛 차트 생성
  const segments = Object.entries(workoutTypes).map(([type, value], index) => {
    const percentage = (value / total) * 100;
    const dashoffset = circumference * (1 - value / total);
    const rotation = offset * 3.6; // 360 / 100
    offset += percentage;

    return (
      <circle
        key={index}
        cx="50"
        cy="50"
        r="35"
        fill="transparent"
        stroke={colors[type] || `hsl(${index * 60}, 70%, 60%)`}
        strokeWidth="23"
        strokeDasharray={circumference}
        strokeDashoffset={dashoffset}
        transform={`rotate(${rotation} 50 50)`}
      />
    );
  });

  return (
    <div className="relative w-full">
      <div className="flex items-center justify-center">
        <svg className="w-45 h-45" viewBox="0 0 100 100">
          {segments}
        </svg>
        <div className="absolute text-2.5-700 font-bold">
          {Math.round(total)}%
        </div>
      </div>
      <div className="flex flex-wrap justify-around text-xs mt-2">
        {Object.entries(workoutTypes).map(([type, value], index) => (
          <div key={index} className="flex items-center my-1">
            <div
              className="w-3 h-3 rounded-full mr-1"
              style={{
                backgroundColor: colors[type] || `hsl(${index * 60}, 70%, 60%)`,
              }}
            ></div>
            <div>
              {type}
              <br />
              {value}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 바 차트 SVG 생성 함수 (근력 운동은 덤벨 아이콘 사용)
const generateBarChart = (dailyWorkouts) => {
  const maxValue = Math.max(...dailyWorkouts.map((day) => day.value));
  const statusColors = {
    complete: 'bg-blue-400',
    incomplete: 'bg-red-400',
    rest: 'bg-gray-300',
  };

  return (
    <div className="flex h-48 w-full items-end justify-between">
      {dailyWorkouts.map((day, index) => (
        <div key={index} className="flex flex-col items-center">
          <div className="relative flex flex-col items-center justify-end h-full">
            {day.hasStrength && (
              <div className="absolute bottom-full mb-1">
                <Image
                  src="/svg/dumbell.svg"
                  width={20}
                  height={20}
                  alt="근력운동"
                />
              </div>
            )}
            <div
              className={`w-8 ${statusColors[day.status]}`}
              style={{
                height: day.value ? `${(day.value / maxValue) * 100}%` : '10%',
                borderRadius: '4px 4px 0 0',
              }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-2">{day.day}</div>
        </div>
      ))}
    </div>
  );
};

// 목업 데이터
const MOCK_DATA = {
  user1: {
    name: '김철수',
    achievement: 88,
    weeklyWorkouts: [
      {
        weekNumber: 1,
        label: '03.20-03.26',
        totalAchievement: 88,
        workoutTypes: {
          HIT: 40,
          일반기기: 38.2,
          걷기: 9.8,
        },
        dailyWorkouts: [
          { day: '월', value: 45, status: 'complete', hasStrength: true },
          { day: '화', value: 30, status: 'incomplete', hasStrength: false },
          { day: '수', value: 20, status: 'complete', hasStrength: false },
          { day: '목', value: 60, status: 'complete', hasStrength: true },
          { day: '금', value: 30, status: 'complete', hasStrength: false },
          { day: '토', value: 30, status: 'complete', hasStrength: true },
          { day: '일', value: 30, status: 'complete', hasStrength: false },
        ],
        totalSessions: 5,
        requiredSessions: 2,
        feedback: {
          text: '김철수님 이번 주 운동 목표를 달성하셨네요! 특히 HIT 운동의 비중이 높아 효과적인 운동이 되었을 것 같아요. 다음 주에는 걷기의 비중을 조금 더 높여보는 것도 좋을 것 같습니다.',
          author: '코치 이지훈',
          date: '2023.10.24 14:15:34',
        },
      },
    ],
  },
  user2: {
    name: '이영희',
    achievement: 75,
    weeklyWorkouts: [
      {
        weekNumber: 1,
        label: '03.20-03.26',
        totalAchievement: 75,
        workoutTypes: {
          HIT: 35,
          일반기기: 30,
          걷기: 10,
        },
        dailyWorkouts: [
          { day: '월', value: 40, status: 'complete', hasStrength: false },
          { day: '화', value: 0, status: 'incomplete', hasStrength: false },
          { day: '수', value: 15, status: 'complete', hasStrength: true },
          { day: '목', value: 50, status: 'complete', hasStrength: true },
          { day: '금', value: 25, status: 'complete', hasStrength: false },
          { day: '토', value: 0, status: 'rest', hasStrength: false },
          { day: '일', value: 0, status: 'rest', hasStrength: false },
        ],
        totalSessions: 3,
        requiredSessions: 5,
        feedback: {
          text: '이영희님, 운동을 시작하신 첫 주차네요. 일반기기 운동 비중이 높았고, 주 3회 운동을 하셨습니다. 다음 주에는 목표인 5회를 달성해보시는 것이 어떨까요?',
          author: '코치 박성민',
          date: '2023.10.24 14:15:34',
        },
      },
    ],
  },
  user3: {
    name: '박지민',
    achievement: 50,
    weeklyWorkouts: [
      {
        weekNumber: 1,
        label: '03.20-03.26',
        totalAchievement: 50,
        workoutTypes: {
          HIT: 20,
          일반기기: 25,
          걷기: 5,
        },
        dailyWorkouts: [
          { day: '월', value: 0, status: 'incomplete', hasStrength: false },
          { day: '화', value: 30, status: 'complete', hasStrength: true },
          { day: '수', value: 0, status: 'incomplete', hasStrength: false },
          { day: '목', value: 0, status: 'incomplete', hasStrength: false },
          { day: '금', value: 25, status: 'complete', hasStrength: false },
          { day: '토', value: 0, status: 'rest', hasStrength: false },
          { day: '일', value: 0, status: 'rest', hasStrength: false },
        ],
        totalSessions: 2,
        requiredSessions: 5,
        feedback: {
          text: '박지민님, 첫 주차 운동을 시작하셨네요. 화요일과 금요일에만 운동을 하셨는데, 다음 주에는 좀 더 자주 운동해보시면 어떨까요?',
          author: '코치 김민수',
          date: '2023.10.24 14:15:34',
        },
      },
    ],
  },
  default: {
    name: '최한',
    achievement: 88,
    weeklyWorkouts: [
      {
        weekNumber: 1,
        label: '03.20-03.26',
        totalAchievement: 88,
        workoutTypes: {
          HIT: 40,
          일반기기: 38.2,
          걷기: 9.8,
        },
        dailyWorkouts: [
          { day: '월', value: 45, status: 'complete', hasStrength: true },
          { day: '화', value: 30, status: 'incomplete', hasStrength: false },
          { day: '수', value: 20, status: 'complete', hasStrength: false },
          { day: '목', value: 60, status: 'complete', hasStrength: true },
          { day: '금', value: 30, status: 'complete', hasStrength: false },
          { day: '토', value: 30, status: 'complete', hasStrength: true },
          { day: '일', value: 30, status: 'complete', hasStrength: false },
        ],
        totalSessions: 5,
        requiredSessions: 2,
        feedback: {
          text: '최한님 이번 주 운동 목표를 달성하셨네요! 특히 HIT 운동의 비중이 높아 효과적인 운동이 되었을 것 같아요.',
          author: '코치 이지훈',
          date: '2023.10.24 14:15:34',
        },
      },
    ],
  },
};

// 운동 상세 페이지 컴포넌트
export default function UserWorkoutDetailPage() {
  const params = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(0); // 기본값은 첫 번째 주

  useEffect(() => {
    // WorkoutTable에서 전달받은 userId 사용
    const mockUserId = params.userId;

    // 목업 데이터 사용
    setTimeout(() => {
      const userData = MOCK_DATA[mockUserId] || MOCK_DATA.default;
      setUserData(userData);
      setLoading(false);
    }, 500);

    // 페이지 로드 시 상단으로 스크롤
    window.scrollTo(0, 0);
  }, [params]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!userData) {
    return <div>사용자 데이터를 불러오는 중 오류가 발생했습니다.</div>;
  }

  // 선택된 주차 데이터
  const weekData = userData.weeklyWorkouts[selectedWeek];

  return (
    <div className="flex w-full  p-4">
      {/* Main Content */}
      <div className="w-full md:w-4/6 mr-2 flex flex-col gap-5">
        {/* Top Performance Card */}
        <div className="font-bold mb-1">{userData.name} 님의 운동현황</div>
        <div className="w-1/3 sm:w-full">
          <TotalFeedbackCounts
            counts={`${100}pt`}
            title="총 운동포인트"
            borderColor="border-blue-500"
            textColor="text-blue-500"
          />
        </div>

        <div className="font-bold mb-4">주간운동 그래프</div>

        <div>
          <WeeklyWorkoutChart userName={userData.name} />
          {/* First Chart Panel */}
          <div className="bg-white rounded-lg p-6 mb-4 shadow-sm">
            <div className="font-bold mb-4">지난 주 운동 그래프</div>

            <div className="flex mb-6 sm:flex-col">
              {/* Donut Chart */}
              <div className="flex flex-col w-1/3 sm:w-full sm:gap-6">
                <div className="relative">
                  {generateDonutChart(weekData.workoutTypes)}
                </div>
                <div className="flex justify-between text-sm mt-4 bg-gray-8 px-[1.875rem] py-[1.25rem]">
                  <div className="text-gray-500">근력 운동</div>
                  <div className="text-blue-500 text-2.5-900 pt-5">
                    {weekData.totalSessions}
                    <span className="text-1.75-900">
                      /{weekData.requiredSessions} 회
                    </span>
                  </div>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="w-2/3 flex items-end pl-6 sm:w-full">
                {generateBarChart(weekData.dailyWorkouts)}
              </div>
            </div>
          </div>

          {/* Second Chart Panel (Duplicate of the first) */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="font-bold mb-4">이번 주 운동 그래프</div>

            <div className="flex gap-6 mb-6 sm:flex-col sm:gap-6">
              {/* 왼쪽: 도넛 차트 + 근력운동 */}
              <div className="flex flex-col items-center w-1/3 sm:w-full">
                <div className="relative w-full">
                  {generateDonutChart(weekData.workoutTypes)}
                </div>
                <div className="flex justify-between text-sm mt-4 w-full bg-gray-8 px-[1.875rem] py-[1.25rem]">
                  <div className="text-gray-500">근력 운동</div>
                  <div className="text-blue-500 text-2.5-900 pt-5">
                    {weekData.totalSessions}
                    <span className="text-1.75-900">
                      /{weekData.requiredSessions} 회
                    </span>
                  </div>
                </div>
              </div>

              {/* 오른쪽: 바차트 + TextBox */}
              <div className="flex flex-col w-2/3 sm:w-full sm:items-center">
                <div className="flex items-end mb-4">
                  {generateBarChart(weekData.dailyWorkouts)}
                </div>
                <div>
                  <TextBox
                    title="코치 피드백"
                    value={weekData.feedback.text}
                    placeholder="피드백을 작성하세요."
                    button1="남기기"
                    Btn1className="bg-green text-white"
                    svg1="/svg/send.svg"
                    onChange={(e) => console.log(e.target.value)}
                    onSave={async (feedback) => console.log('Saved:', feedback)}
                    isFeedbackMode={true}
                    copyIcon
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
