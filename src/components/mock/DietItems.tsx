import { Meal, Coach, AIFeedback, DietFeedback } from '@/types/mockType';

const Meals: Meal[] = [
  {
    meal_id: 'meal_001',
    user_id: 'user_001',
    meal_type: 'BREAKFAST',
    date: '2024-10-08',
    image_url_1: '/food.png',
    image_url_2: '/food.png',
    image_url_3: null,
    image_url_4: null,
    description:
      '사과 한개, 오트밀 커피 라떼 1잔, 샐러드, 오트밀 커피 라떼 1잔, 사과 반쪽, 피넛버터 한스푼,사과 한개, 오트밀 커피 라떼 1잔, 샐러드, 오트밀 커피 라떼 1잔, 사과 반쪽, 피넛버터 한스푼',
    additional_comments: '',
    created_at: '2024-10-08T08:00:00',
    updated_at: '2024-10-08T08:00:00',
  },
  {
    meal_id: 'meal_002',
    user_id: 'user_001',
    meal_type: 'LUNCH',
    date: '2024-10-08',
    image_url_1: '/food.png',
    image_url_2: '/food.png',
    image_url_3: null,
    image_url_4: null,
    description: '샐러드, 오트밀 커피 라떼 1잔',
    additional_comments: '',
    created_at: '2024-10-08T12:00:00',
    updated_at: '2024-10-08T12:00:00',
  },
  {
    meal_id: 'meal_003',
    user_id: 'user_001',
    meal_type: 'DINNER',
    date: '2024-10-08',
    image_url_1: '/food.png',
    image_url_2: '/food.png',
    image_url_3: '/food.png',
    image_url_4: null,
    description:
      '사과 한개, 오트밀 커피 라떼 1잔,사과 한개, 오트밀 커피 라떼 1잔샐러드, 오트밀 커피 라떼 1잔, 사과 반쪽, 피넛버터 한스푼(무설탕 100%), 토마토 1, 양배추, 샐러드, 계란후라이2, 삶은계란 흰자 1, 체다치즈 한 장(스스로 계산한 칼로리 410kcal)',
    additional_comments: '',
    created_at: '2024-10-08T18:00:00',
    updated_at: '2024-10-08T18:00:00',
  },
  {
    meal_id: 'meal_004',
    user_id: 'user_001',
    meal_type: 'SNACK',
    date: '2024-10-08',
    image_url_1: '/food.png',
    image_url_2: null,
    image_url_3: null,
    image_url_4: null,
    description:
      '사과 한개, 오트밀 커피 라떼 1잔,사과 한개, 오트밀 커피 라떼 1잔샐러드, 오트밀 커피 라떼 1잔, 사과 반쪽, 피넛버터 한스푼(무설탕 100%), 토마토 1, 양배추, 샐러드, 계란후라이2, 삶은계란 흰자 1, 체다치즈 한 장(스스로 계산한 칼로리 410kcal)',
    additional_comments: '',
    created_at: '2024-10-08T15:00:00',
    updated_at: '2024-10-08T15:00:00',
  },
];

const Coaches: Coach[] = [
  {
    coach_id: 'coach_001',
    name: '김코치',
    email: 'kimcoach@example.com',
    specialization: '영양 상담',
    created_at: '2024-09-01T08:00:00',
    updated_at: '2024-09-01T08:00:00',
  },
  {
    coach_id: 'coach_002',
    name: '박코치',
    email: 'parkcoach@example.com',
    specialization: '체력 훈련',
    created_at: '2024-09-02T08:00:00',
    updated_at: '2024-09-02T08:00:00',
  },
];

const AI_Feedback: AIFeedback[] = [
  {
    feedback_id: 'feedback_001',
    user_id: 'user_001',
    date: '2024-10-08',
    ai_feedback_text:
      '식단 균형이 매우 좋습니다. 탄수화물과 단백질이 적당히 섭취되었습니다.',
    created_at: '2024-10-08T08:00:00',
  },
  {
    feedback_id: 'feedback_002',
    user_id: 'user_002',
    date: '2024-10-07',
    ai_feedback_text:
      '단백질 섭취가 약간 부족할 수 있습니다. 추가 섭취를 권장합니다.',
    created_at: '2024-10-07T08:00:00',
  },
];

const Diet_Feedback: DietFeedback[] = [
  {
    feedback_id: 'diet_feedback_001',
    user_id: 'user_001',
    coach_id: 'coach_001',
    date: '2024-10-08',
    feedback_text:
      '좋은 식단을 유지하고 있으니 앞으로도 계속 이렇게 유지하세요.',
    nutritional_analysis: '탄수화물: 적당, 단백질: 적당, 지방: 적당',
    meal_balance_score: 95,
    suggested_improvements: '추가 개선 필요 없음',

    created_at: '2024-10-08T10:00:00',
    updated_at: '2024-10-08T10:00:00',
  },
  {
    feedback_id: 'diet_feedback_002',
    user_id: 'user_002',
    coach_id: 'coach_002',
    date: '2024-10-07',
    feedback_text: '단백질 섭취를 좀 더 늘려보세요.',
    nutritional_analysis: '탄수화물: 적당, 단백질: 부족, 지방: 적당',
    meal_balance_score: 75,
    suggested_improvements: '단백질 보충제 섭취를 추천드립니다.',

    created_at: '2024-10-07T10:00:00',
    updated_at: '2024-10-07T10:00:00',
  },
];

export { Meals, Coaches, Diet_Feedback, AI_Feedback };
