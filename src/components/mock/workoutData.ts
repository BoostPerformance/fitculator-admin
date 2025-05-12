// src/mocks/workoutData.ts

export const MOCK_WORKOUT_DATA = {
  user: {
    id: 'mock-user-id',
    name: '사용자',
    displayName: '사용자',
  },
  weeklyWorkouts: [
    {
      weekNumber: 1,
      label: '03.20-03.26',
      totalAchievement: 88,
      workoutTypes: {
        달리기: 40,
        사이클: 38,
        걷기: 10,
        등산: 12,
      },
      dailyWorkouts: [
        {
          day: '월',
          value: 45,
          status: 'complete',
          hasStrength: true,
          strengthCount: 2,
        },
        {
          day: '화',
          value: 30,
          status: 'incomplete',
          hasStrength: false,
          strengthCount: 0,
        },
        {
          day: '수',
          value: 20,
          status: 'complete',
          hasStrength: false,
          strengthCount: 0,
        },
        {
          day: '목',
          value: 60,
          status: 'complete',
          hasStrength: true,
          strengthCount: 1,
        },
        {
          day: '금',
          value: 30,
          status: 'complete',
          hasStrength: false,
          strengthCount: 0,
        },
        {
          day: '토',
          value: 0,
          status: 'rest',
          hasStrength: false,
          strengthCount: 0,
        },
        {
          day: '일',
          value: 0,
          status: 'rest',
          hasStrength: false,
          strengthCount: 0,
        },
      ],
      totalSessions: 3,
      requiredSessions: 3,
      feedback: {
        text: '이번 주 운동 목표를 달성하셨네요! 특히 달리기와 사이클의 비중이 높아 효과적인 운동이 되었을 것 같아요.',
        author: 'AI 코치',
        date: '2023.10.24 14:15:34',
      },
    },
    {
      weekNumber: 2,
      label: '03.27-04.02',
      totalAchievement: 75,
      workoutTypes: {
        달리기: 30,
        수영: 25,
        테니스: 10,
        사이클: 10,
      },
      dailyWorkouts: [
        {
          day: '월',
          value: 40,
          status: 'complete',
          hasStrength: true,
          strengthCount: 1,
        },
        {
          day: '화',
          value: 0,
          status: 'incomplete',
          hasStrength: false,
          strengthCount: 0,
        },
        {
          day: '수',
          value: 35,
          status: 'complete',
          hasStrength: true,
          strengthCount: 1,
        },
        {
          day: '목',
          value: 0,
          status: 'incomplete',
          hasStrength: false,
          strengthCount: 0,
        },
        {
          day: '금',
          value: 0,
          status: 'incomplete',
          hasStrength: false,
          strengthCount: 0,
        },
        {
          day: '토',
          value: 0,
          status: 'rest',
          hasStrength: false,
          strengthCount: 0,
        },
        {
          day: '일',
          value: 0,
          status: 'rest',
          hasStrength: false,
          strengthCount: 0,
        },
      ],
      totalSessions: 2,
      requiredSessions: 3,
      feedback: {
        text: '이번 주는 기대보다 적게 운동하셨네요. 다음 주에는 좀 더 자주 운동하면 좋겠습니다.',
        author: 'AI 코치',
        date: '2023.10.31 11:25:17',
      },
    },
  ],
  stats: {
    totalWeeks: 2,
    totalCardioPoints: 163,
    totalStrengthSessions: 5,
  },
};

// 주간 운동 차트 목데이터
export const MOCK_WEEKLY_CHART_DATA = {
  userName: '사용자',
  weeklyWorkouts: [
    {
      weekNumber: 1,
      label: '03.20-03.26',
      totalAchievement: 88,
      totalSessions: 3,
    },
    {
      weekNumber: 2,
      label: '03.27-04.02',
      totalAchievement: 75,
      totalSessions: 2,
    },
  ],
  userId: 'mock-user-id',
};
