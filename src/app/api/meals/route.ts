import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface Organization {
 id: string;
 name: string;
 description?: string;
 logo_url?: string;
}

interface Challenge {
 id: string;
 title: string;
 organization_id: string;
 challenge_type: 'diet' | 'exercise' | 'diet_and_exercise';
 description?: string;
 start_date: string;
 end_date: string;
 organizations?: Organization[];
}

interface User {
 id: string;
 name: string;
 username?: string;
 email: string;
 profile_image_url?: string;
}

interface ChallengeParticipant {
 id: string;
 service_user_id: string;
 challenge_id: string;
 assigned_coach_id?: string;
 status: 'active' | 'completed' | 'dropped';
 users?: User;
 challenge?: {
 title: string;
 start_date: string;
 end_date: string;
 };
}

interface MealPhoto {
 id: string;
 meal_id: string;
 photo_url: string;
}

interface Meal {
 id: string;
 daily_record_id: string;
 meal_type:
 | 'breakfast'
 | 'lunch'
 | 'dinner'
 | 'snack'
 | 'supplement'
 | 'water';
 description: string;
 meal_time: string;
 meal_photos?: MealPhoto[];
}

interface Feedback {
 id: string;
 daily_record_id: string;
 coach_id?: string;
 coach_feedback?: string;
 ai_feedback: string;
}

interface DailyRecord {
 id: string;
 participant_id: string;
 record_date: string;
 challenge_participants?: ChallengeParticipant[];
 feedbacks?: Feedback[];
 meals?: Meal[];
}

type Database = {
 public: {
 Tables: {
 daily_records: {
 Row: DailyRecord;
 };
 challenge_participants: {
 Row: ChallengeParticipant;
 };
 users: {
 Row: User;
 };
 organizations: {
 Row: Organization;
 };
 challenges: {
 Row: Challenge;
 };
 feedbacks: {
 Row: Feedback;
 };
 meals: {
 Row: Meal;
 };
 meal_photos: {
 Row: MealPhoto;
 };
 };
 };
};

export const dynamic = 'force-dynamic'; // Next.js 캐싱 비활성화
export const fetchCache = 'force-no-store'; // fetch 캐싱 비활성화
export const revalidate = 0; // 재검증 비활성화

const supabase = createClient<Database>(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface QueryResult {
 id: string;
 record_date: string;
 challenge_participants: {
 id: string;
 users: {
 id: string;
 name: string;
 username: string;
 };
 challenges: {
 id: string;
 title: string;
 start_date: string;
 end_date: string;
 organizations: {
 id: string;
 name: string;
 }[];
 };
 }[];
 feedbacks: {
 coach_feedback: string;
 ai_feedback: string;
 }[];
 meals: {
 id: string;
 meal_type: string;
 description: string;
 meal_time: string;
 meal_photos: {
 id: string;
 photo_url: string;
 }[];
 }[];
}

export async function GET(request: Request) {
 //('🔄 === Meals API Request Start ===');
 try {
 const requestUrl = new URL(request.url);
 const timestamp = requestUrl.searchParams.get('t') || Date.now();
 const date = requestUrl.searchParams.get('date');
 const dailyRecordId = requestUrl.searchParams.get('dailyRecordId');

 // console.log('📥 Request parameters:', {
 // url: request.url,
 // timestamp,
 // date,
 // dailyRecordId,
 // });

 if (!dailyRecordId || !date) {
 throw new Error('Daily Record ID and date are required');
 }

 // console.log('🔍 Searching for daily record with:', {
 // dailyRecordId,
 // date,
 // });

 // 1. daily_record_id로 participant_id 조회
 const { data: dailyRecord, error: dailyRecordError } = await supabase
 .from('daily_records')
 .select('participant_id')
 .eq('id', dailyRecordId)
 .single();

 if (dailyRecordError) throw dailyRecordError;
 if (!dailyRecord) throw new Error('Daily record not found');

 const participantId = dailyRecord.participant_id;

 // 2. participant_id로 모든 필요한 정보 조회
 const { data: participantData, error: participantError } = await supabase
 .from('challenge_participants')
 .select(
 `
 id,
 users!inner (
 name
 ),
 challenge:challenges!inner (
 title,
 start_date,
 end_date,
 organization:organizations!inner (
 id,
 name
 )
 )
 `
 )
 .eq('id', participantId)
 .single();

 if (participantError) throw participantError;

 // 3. 해당 daily record의 meals 조회
 const { data: meals, error: mealsError } = await supabase
 .from('meals')
 .select(
 `
 id,
 meal_type,
 description,
 meal_time,
 meal_photos (
 id,
 photo_url
 )
 `
 )
 .eq('daily_record_id', dailyRecordId);

 if (mealsError) throw mealsError;

 // 4. 피드백 조회
 const { data: feedback, error: feedbackError } = await supabase
 .from('feedbacks')
 .select('coach_feedback, ai_feedback')
 .eq('daily_record_id', dailyRecordId)
 .single();

 if (feedbackError && feedbackError.code !== 'PGRST116') throw feedbackError;

 // 5. 식단 업로드 일수 조회
 const challengeStartDate = new Date((participantData.challenge as any).start_date);
 const challengeEndDate = new Date((participantData.challenge as any).end_date);

 const { data: daysWithMeals, error: daysWithMealsError } = await supabase
 .from('daily_records')
 .select(
 `
 id, 
 record_date,
 meals!inner (id) 
 `
 )
 .eq('participant_id', participantId)
 .gte('record_date', challengeStartDate.toISOString().split('T')[0]) // 챌린지 시작일 이후
 .lte('record_date', challengeEndDate.toISOString().split('T')[0]); // 챌린지 종료일 이전

 if (daysWithMealsError) throw daysWithMealsError;

 // 중복 제거를 위해 Set 객체 사용 (같은 날짜에 여러 meal이 있을 수 있음)
 const uniqueDatesWithMeals = new Set();
 daysWithMeals.forEach((record) => {
 if (record.record_date) {
 uniqueDatesWithMeals.add(record.record_date);
 }
 });

 const uploadDaysCount = uniqueDatesWithMeals.size;

 // 콘솔에 결과 기록 (디버깅용)
// console.log('식단 업로드 일수 계산:', {
 // participantId,
 // 챌린지시작일: challengeStartDate,
 // 챌린지종료일: challengeEndDate,
 // 식단있는레코드수: daysWithMeals.length,
 // 고유날짜수: uploadDaysCount,
 // 고유날짜목록: Array.from(uniqueDatesWithMeals),
 // });

 // 식사 데이터 그룹화 및 변환
 const groupedMeals = {
 breakfast:
 meals
 .filter((m) => m.meal_type === 'breakfast')
 .map((m) => ({
 id: m.id,
 description: m.description,
 meal_time: m.meal_time,
 meal_photos:
 m.meal_photos?.map((p) => ({
 id: p.id,
 url: p.photo_url,
 })) || [],
 })) || [],
 lunch:
 meals
 .filter((m) => m.meal_type === 'lunch')
 .map((m) => ({
 id: m.id,
 description: m.description,
 meal_time: m.meal_time,
 meal_photos:
 m.meal_photos?.map((p) => ({
 id: p.id,
 url: p.photo_url,
 })) || [],
 })) || [],
 dinner:
 meals
 .filter((m) => m.meal_type === 'dinner')
 .map((m) => ({
 id: m.id,
 description: m.description,
 meal_time: m.meal_time,
 meal_photos:
 m.meal_photos?.map((p) => ({
 id: p.id,
 url: p.photo_url,
 })) || [],
 })) || [],
 snack:
 meals
 .filter((m) => m.meal_type === 'snack')
 .map((m) => ({
 id: m.id,
 description: m.description,
 meal_time: m.meal_time,
 meal_photos:
 m.meal_photos?.map((p) => ({
 id: p.id,
 url: p.photo_url,
 })) || [],
 })) || [],
 supplement:
 meals
 .filter((m) => m.meal_type === 'supplement')
 .map((m) => ({
 id: m.id,
 description: m.description,
 meal_time: m.meal_time,
 meal_photos:
 m.meal_photos?.map((p) => ({
 id: p.id,
 url: p.photo_url,
 })) || [],
 })) || [],
 water:
 meals
 .filter((m) => m.meal_type === 'water')
 .map((m) => ({
 id: m.id,
 description: m.description,
 meal_time: m.meal_time,
 meal_photos:
 m.meal_photos?.map((p) => ({
 id: p.id,
 url: p.photo_url,
 })) || [],
 })) || [],
 };

 // 최종 데이터 변환
 const transformedData = {
 id: dailyRecordId,
 record_date: date,
 user: participantData.users,
 challenge: participantData.challenge // 배열 참조 제거
 ? {
 title: (participantData.challenge as any).title,
 start_date: (participantData.challenge as any).start_date,
 end_date: (participantData.challenge as any).end_date,
 organization: (participantData.challenge as any).organization || null,
 }
 : null,
 feedbacks: feedback || {
 coach_feedback: '',
 ai_feedback: '',
 },
 upload_days_count: uploadDaysCount || 0,
 meals: groupedMeals,
 };

 // console.log('✅ Transformed data ready');

 return new NextResponse(JSON.stringify(transformedData), {
 headers: {
 'Content-Type': 'application/json',
 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
 Pragma: 'no-cache',
 Expires: '-1',
 'X-Request-Time': timestamp.toString(),
 'Surrogate-Control': 'no-store',
 Vary: '*',
 },
 });
 } catch (error) {
// console.error('❌ === Meals API Error ===');
// console.error(error);
// console.error('Error details:', {
 // name: error instanceof Error ? error.name : 'Unknown error',
 // message: error instanceof Error ? error.message : String(error),
 // timestamp: new Date().toISOString(),
 // });

 return NextResponse.json(
 {
 error: 'Failed to fetch meals',
 details: error instanceof Error ? error.message : 'Unknown error',
 },
 {
 status: 500,
 headers: {
 'Cache-Control':
 'no-store, no-cache, must-revalidate, proxy-revalidate',
 Pragma: 'no-cache',
 Expires: '0',
 },
 }
 );
 }
}
