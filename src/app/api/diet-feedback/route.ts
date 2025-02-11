/**
 * AI 식단 피드백 API 예시
 *
 * 입력값 예시:
 * {
 *   "dailyRecordId": "clrx2k3p0000abc123def456",
 *   "challengeInfo": {
 *     "currentDay": 15,  // 챌린지 15일차
 *     "totalDays": 30    // 30일 챌린지
 *   },
 *   "meals": [
 *     {
 *       "meal_type": "아침",
 *       "description": "현미밥 2공기, 계란프라이 2개, 시금치나물 1접시, 된장국",
 *       "meal_photos": [
 *         {
 *           "url": "https://example.com/breakfast.jpg"
 *         }
 *       ]
 *     },
 *     {
 *       "meal_type": "점심",
 *       "description": "흰쌀밥 1공기, 제육볶음 2인분, 김치찌개",
 *       "meal_photos": [
 *         {
 *           "url": "https://example.com/lunch.jpg"
 *         }
 *       ]
 *     }
 *   ],
 *   "exercise": {
 *     "type": "러닝",
 *     "duration": 120,    // 분 단위
 *     "intensity": "고강도",
 *     "distance": 20,     // km
 *     "calories_burned": 1600,
 *     "points": 850
 *   },
 *   "user": {
 *     "name": "김철수",
 *     "gender": "male",
 *     "birth": "1990-01-01",
 *     "resting_heart_rate": 65
 *   }
 * }
 *
 * 출력값 예시:
 * {
 *   "id": "clrx2k3p1000def456abc789",
 *   "daily_record_id": "clrx2k3p0000abc123def456",
 *   "ai_feedback": "1. 전반적인 평가\n
 *     챌린지 15일차, 오늘 하루 식단은 평소보다 탄수화물과 단백질 섭취량이 높았지만,
 *     20km 장거리 러닝으로 1600kcal를 소비하여 전반적인 영양 균형이 잘 맞았습니다.
 *     특히 고강도 운동에 맞춘 충분한 에너지 섭취가 돋보입니다.\n\n
 *     2. 장점\n
 *     - 장거리 러닝을 위한 충분한 탄수화물 섭취가 잘 이루어졌습니다.\n
 *     - 운동 후 단백질 보충을 위한 제육볶음 섭취가 적절합니다.\n
 *     - 시금치나물을 통한 철분 섭취로 운동 시 산소 운반 능력 향상에 도움이 됩니다.\n\n
 *     3. 개선점\n
 *     - 장거리 러닝 후 수분과 전해질 보충을 위한 음료 섭취가 필요해 보입니다.\n
 *     - 운동 강도가 높은 만큼 회복을 위한 과일이나 견과류 섭취를 추천드립니다.\n\n
 *     4. 맞춤 조언\n
 *     챌린지 중반부인 15일차에 접어들면서 운동 강도가 매우 높아진 것으로 보입니다.
 *     오늘처럼 20km 러닝을 소화한 날은 충분한 탄수화물 섭취가 중요하므로
 *     현재의 식사량은 적절합니다. 다만, 내일도 고강도 운동을 계획하고 있다면
 *     오늘 저녁 식사에서 회복을 위한 영양소 보충이 더욱 중요합니다.
 *     850포인트의 높은 운동 점수를 획득하신 만큼, 단백질과 탄수화물의
 *     균형잡힌 섭취로 근손실을 방지하고 회복에 집중하시기 바랍니다."
 * }
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import Anthropic from '@anthropic-ai/sdk';

// Anthropic client 초기화
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: Request) {
  try {
    const { dailyRecordId } = await request.json();

    // 1. 해당 일자의 식단 기록 조회
    const dailyRecord = await prisma.daily_records.findUnique({
      where: { id: dailyRecordId },
      include: {
        meals: {
          include: {
            meal_photos: true,
          },
        },
        challenge_participants: {
          include: {
            users: {
              select: {
                name: true,
                gender: true,
                birth: true,
                resting_heart_rate: true,
              },
            },
            challenges: {
              select: {
                start_date: true,
                end_date: true,
              },
            },
          },
        },
      },
    });

    if (!dailyRecord) {
      return NextResponse.json(
        { error: 'Daily record not found' },
        { status: 404 }
      );
    }

    // 2. 챌린지 진행 일수 계산
    const startDate = new Date(
      dailyRecord.challenge_participants.challenges.start_date
    );
    const currentDate = new Date(dailyRecord.record_date);
    const challengeDay =
      Math.floor(
        (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
    const totalDays =
      Math.floor(
        (new Date(
          dailyRecord.challenge_participants.challenges.end_date
        ).getTime() -
          startDate.getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1;

    // 3. 식단 정보를 문자열로 변환
    const mealsInfo = dailyRecord.meals
      .map((meal) => {
        return `${meal.meal_type}: ${meal.description}`;
      })
      .join('\n');

    // 4. AI 피드백 생성

    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `아래는 회원의 챌린지 ${challengeDay}일차 식단 기록입니다. 회원 정보와 식단을 분석하여 맞춤형 피드백을 제공해주세요.

        회원 정보:
        - 이름: ${dailyRecord.challenge_participants.users.name || '정보 없음'}
        - 성별: ${
          dailyRecord.challenge_participants.users.gender || '정보 없음'
        }${
            dailyRecord.challenge_participants.users.birth
              ? `\n- 나이: ${
                  new Date().getFullYear() -
                  new Date(
                    dailyRecord.challenge_participants.users.birth
                  ).getFullYear()
                }세`
              : ''
          }${
            dailyRecord.challenge_participants.users.resting_heart_rate
              ? `\n- 안정시 심박수: ${dailyRecord.challenge_participants.users.resting_heart_rate}`
              : ''
          }

        챌린지 정보:
        - 현재 ${challengeDay}일차 / 총 ${totalDays}일

        식단 기록:
        ${mealsInfo}


        피드백은 다음 형식으로 작성해주세요:
        0. 영양 성분
        1. 전반적인 평가
        2. 장점
        3. 개선점
        4. 맞춤 조언 (가능한 경우 회원의 나이와 성별을 고려한 구체적인 영양 조언)
        
        예를 들면, 

        **DAY 11 (목) 식단**

        - 총 섭취 칼로리: 약 1300kcal (부족)
        - 탄수화물: 100.67g (적절)
        - 단백질: 35.2g (부족)
        - 지방: 20.83g (적절)
        
        🍽️ ${
          dailyRecord.challenge_participants.users.name
        } 님, 마찬가지로! 하루에 이것밖에 안드시면, 정상적인 식사로 보기 어려워요. 피자를 드시면서 탄수화물 섭취량이 어느정도 적절 범위에 들어오긴 했지만, 한빈님의 체격을 고려하고, 전 날 섭취량이 아주 적었던걸 고려하면 사실 부족했다고 봐야해요.
        
        단백질 섭취도 너무너무 부족해요. 단백질 보충을 위해 닭가슴살이나 단백질 쉐이크 등 추가 섭취가 필요해요.
        
        ---
        
        또는 

        ---
        
        **DAY 10 (수) 식단**
        
        - 총 섭취 칼로리: 약 2200kcal (과다)
        - 탄수화물: 280g (과다)
        - 단백질: 90g (적절)
        - 지방: 80g (과다)
        
        🍽️ ${
          dailyRecord.challenge_participants.users.name
        } 님, 수요일은 전반적으로 탄수화물 섭취가 많았어요. 특히 캄파뉴와 샌드위치같은 고탄수화물 식품이 많았어요. 
        
        체중감량을 위해서는 탄수화물 섭취를 조절하고 식이섬유가 충분한 채소를 먹거나 단백질 보충을 하세요! 
        화요일은 전체 칼로리가 적어서 탄수화물과 지방 섭취량이 약간 많았어도 ‘적절’을 드렸지만 수요일은 전반적으로 많았어요
        `,
        },
      ],
    });

    // TextBlock 타입에서 text 속성 사용
    const aiFeedback =
      typeof message.content[0] === 'object' && 'text' in message.content[0]
        ? message.content[0].text
        : '';

    // 4. 피드백 저장
    const feedback = await prisma.feedbacks.upsert({
      where: {
        daily_record_id: dailyRecordId,
      },
      update: {
        ai_feedback: aiFeedback,
      },
      create: {
        daily_record_id: dailyRecordId,
        ai_feedback: aiFeedback,
      },
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error generating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to generate feedback' },
      { status: 500 }
    );
  }
}
