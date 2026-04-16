import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

// Load .env or .env.local manually
const envLocalPath = path.resolve(__dirname, '../.env.local');
const envBasePath = path.resolve(__dirname, '../.env');
const envPath = fs.existsSync(envLocalPath) ? envLocalPath : envBasePath;
if (fs.existsSync(envPath)) {
 const envContent = fs.readFileSync(envPath, 'utf-8');
 for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIndex = trimmed.indexOf('=');
  if (eqIndex === -1) continue;
  const key = trimmed.slice(0, eqIndex).trim();
  const value = trimmed.slice(eqIndex + 1).trim();
  if (!process.env[key]) {
   process.env[key] = value;
  }
 }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY!;

if (!supabaseUrl || !supabaseKey) {
 console.error('Missing Supabase environment variables');
 process.exit(1);
}
if (!anthropicApiKey) {
 console.error('Missing ANTHROPIC_API_KEY');
 process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const anthropic = new Anthropic({ apiKey: anthropicApiKey });

// Parse CLI arguments
function parseArgs() {
 const args = process.argv.slice(2);
 const parsed: { challengeId?: string; week?: number; dryRun: boolean } = { dryRun: false };

 for (let i = 0; i < args.length; i++) {
  if (args[i] === '--challengeId' && args[i + 1]) {
   parsed.challengeId = args[i + 1];
   i++;
  } else if (args[i] === '--week' && args[i + 1]) {
   parsed.week = parseInt(args[i + 1]);
   i++;
  } else if (args[i] === '--dry-run') {
   parsed.dryRun = true;
  }
 }

 if (!parsed.challengeId) {
  console.error('Usage: npx tsx scripts/generate-workout-ai-feedback.ts --challengeId <id> [--week <n>] [--dry-run]');
  process.exit(1);
 }

 return parsed as { challengeId: string; week?: number; dryRun: boolean };
}

async function getChallengeInfo(challengeId: string) {
 const { data, error } = await supabase
  .from('challenges')
  .select('id, title, start_date, end_date')
  .eq('id', challengeId)
  .single();

 if (error) throw new Error(`Challenge not found: ${error.message}`);
 return data;
}

function getWeekStartDate(challengeStartDate: string, weekNumber: number): string {
 const start = new Date(challengeStartDate);
 start.setDate(start.getDate() + (weekNumber - 1) * 7);
 return start.toISOString().split('T')[0];
}

async function getWeeklyRecords(challengeId: string, challengeStartDate: string, weekNumber?: number) {
 // Get participant user IDs
 const { data: participants, error: pErr } = await supabase
  .from('challenge_participants')
  .select('service_user_id')
  .eq('challenge_id', challengeId);

 if (pErr || !participants) throw new Error(`Failed to fetch participants: ${pErr?.message}`);

 const userIds = participants.map((p) => p.service_user_id);

 // Build query for weekly records
 let query = supabase
  .from('workout_weekly_records')
  .select('id, user_id, start_date, end_date, cardio_points_total, strength_sessions_count')
  .in('user_id', userIds)
  .order('start_date', { ascending: true });

 if (weekNumber !== undefined) {
  const weekStart = getWeekStartDate(challengeStartDate, weekNumber);
  query = query.eq('start_date', weekStart);
 }

 const { data, error } = await query;
 if (error) throw new Error(`Failed to fetch weekly records: ${error.message}`);

 // Add computed week_number
 const challengeStart = new Date(challengeStartDate);
 return (data || []).map((r) => {
  const recordStart = new Date(r.start_date);
  const diffDays = Math.round((recordStart.getTime() - challengeStart.getTime()) / (1000 * 60 * 60 * 24));
  return { ...r, week_number: Math.floor(diffDays / 7) + 1 };
 });
}

async function getUserInfo(userId: string) {
 const { data, error } = await supabase
  .from('users')
  .select('name, gender, birth, resting_heart_rate')
  .eq('id', userId)
  .single();

 if (error) return null;
 return data;
}

async function getWeekWorkouts(userId: string, startDate: string, endDate: string) {
 const { data, error } = await supabase
  .from('workouts')
  .select(`
   id, user_id, category_id, timestamp, start_time, end_time,
   points, duration_minutes, duration_seconds, title, intensity,
   note, avg_heart_rate, max_heart_rate, distance, calories, rpe,
   workout_activity_type
  `)
  .eq('user_id', userId)
  .gte('timestamp', startDate)
  .lte('timestamp', endDate)
  .order('timestamp', { ascending: true });

 if (error) return [];
 return data || [];
}

async function getCoachFeedbackForPreviousWeek(challengeId: string, userId: string, currentWeekStart: string) {
 const prevWeekStart = new Date(currentWeekStart);
 prevWeekStart.setDate(prevWeekStart.getDate() - 7);
 const prevWeekStartStr = prevWeekStart.toISOString().split('T')[0];

 const { data } = await supabase
  .from('workout_feedbacks')
  .select('coach_feedback, workout_weekly_records!inner(user_id, start_date)')
  .eq('challenge_id', challengeId)
  .eq('workout_weekly_records.user_id', userId)
  .eq('workout_weekly_records.start_date', prevWeekStartStr)
  .single();

 return data?.coach_feedback || null;
}

function calculateAge(birth: string | null): string {
 if (!birth) return '알 수 없음';
 const birthDate = new Date(birth);
 const now = new Date();
 let age = now.getFullYear() - birthDate.getFullYear();
 const monthDiff = now.getMonth() - birthDate.getMonth();
 if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
  age--;
 }
 return `${age}세`;
}

function calculateTotalWeeks(startDate: string, endDate: string): number {
 const start = new Date(startDate);
 const end = new Date(endDate);
 const diffMs = end.getTime() - start.getTime();
 return Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000));
}

function formatWorkoutsForPrompt(workouts: any[], startDate: string): string {
 const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
 const start = new Date(startDate);
 const dailyMap: Record<string, any[]> = {};

 for (const w of workouts) {
  const ts = new Date(w.timestamp);
  const dateStr = ts.toISOString().split('T')[0];
  if (!dailyMap[dateStr]) dailyMap[dateStr] = [];
  dailyMap[dateStr].push(w);
 }

 const lines: string[] = [];
 for (let i = 0; i < 7; i++) {
  const d = new Date(start);
  d.setDate(d.getDate() + i);
  const dateStr = d.toISOString().split('T')[0];
  const dayName = weekdays[d.getDay()];
  const dayWorkouts = dailyMap[dateStr] || [];

  lines.push(`${dayName}(${dateStr}):`);
  if (dayWorkouts.length === 0) {
   lines.push('  - 운동 없음');
  } else {
   for (const w of dayWorkouts) {
    const duration = w.duration_minutes || Math.round((w.duration_seconds || 0) / 60);
    const points = w.points?.toFixed(1) || '0.0';
    const avgHr = w.avg_heart_rate || '-';
    const maxHr = w.max_heart_rate || '-';
    const dist = w.distance ? `${w.distance.toFixed(1)}km` : '-';
    const rpe = w.rpe || '-';
    const note = w.note || '';
    const title = w.title || '운동';
    const actType = w.workout_activity_type || '-';

    lines.push(`  - ${title} (${actType}) | ${duration}분 | ${points}pt | ${dist} | RPE:${rpe}`);
    lines.push(`    평균심박 ${avgHr}bpm | 최대심박 ${maxHr}bpm`);
    if (note) {
     lines.push(`    노트: ${note}`);
    }
   }
  }
 }

 return lines.join('\n');
}

const WEEK4_PROGRAM = `Week 4 Daily Program (디로드 주간):
- 월(4/06): Aerobic Conditioning - 6x E4MOM: Run/Bike + DB Power Clean + DB Front Rack Squat + Farmers Carry (디로드, 볼륨 축소)
- 화(4/07): Running Performance - 8R: Treadmill Rhythm Run 45s/15s + Plyometric Skill + Ankle Hop + Projection (기술 중심, RPE 6.5-7)
- 수(4/08): Mixed Threshold - 3 Block 21min: Run+Burpee / Row+Sandbag Lunges / Ski+WallBall (RPE 7.5-8)
- 수(4/08): Strength 숙제 - 8min AMRAP: KB Goblet Squat + Reverse Lunge + Single Leg RDL + Copenhagen Plank
- 목(4/09): Recovery Aerobic - 3R Partner: Row/Ski/Run + Hip Bridge + Plate GTO + WallBall Sit-up (RPE 5)
- 금(4/10): HYROX Flow - 3R 6xE2MOM: Row + Offset Squat + Box Jump + KB Row + Push-up + Devil's Press + Sled Push + WallBall (RPE 7)
- 토(4/11): Long easy Endurance - Pick a mountain (Kilimanjaro 5895m / Everest 8848m / K6 7282m), 매 1000m 캠프: WallBall+Box Jump+Burpee+Devil's Press (RPE 6)
- 일(4/12): 프로그램 없음 (개인 훈련/완전 휴식)`;

const SYSTEM_PROMPT = `당신은 "Road to HYROX INCHEON" 챌린지의 전문 HYROX 코치입니다.
HYROX ICN 2026 대회: 5월 15-17일 (현재 약 5주 남음)
현재 4주차는 디로드(deload) 주간입니다.

[말투 가이드]
아래는 실제 코치가 3주차에 작성한 피드백 예시입니다. 이 말투와 톤을 최대한 따라해주세요:

예시1: "락경님,
4/1일 수요일 스키 6분을 평소 해보지 않으셔서 많이 힘드실텐데도, 정말 좋은 페이스로 잘 탔습니다!
다음에는 6분을 탈 때, 힘듬이 적응이 될 때에는 호흡과 자세 이 연결성을 생각하며 6분을 타보는 것을 추천드립니다.
목요일 리커버리도 너무 잘하셨습니다! 다만, 기록해주신 노트와는 다르게.. 최대 심박수가 172bpm까지 올라가셨네요?
리커버리 때는 체감도 좋지만 웨어러블에 표시되는 HR도 둘다 파악하여 유지하려고 노력해보세요!
이번주도 파이팅!"

예시2: "동규님,
화요일 업힐 훈련 어떠셨을지요.
오! 그리고 수요일에 월볼 56개 언브로큰 너무 잘하셨어요!
저번 한주 너무 잘하셨어요! 이번 한주도 파이팅입니다."

예시3: "소영님,
우선 3주차 너무 잘하셨어요!
화요일 업힐 트레이닝 때, 포기하지 않고 끝까지 해낸것! 그게 대단한겁니다.
추가로 아직 러닝 기반 훈련 보강이 필요합니다.
조깅 30분, 주 2회 시간을 내어 추가 숙제 하시는 것을 권장드립니다.
이번주도 파이팅"

[핵심 규칙]
1. 이름 + "님," 으로 시작
2. 구체적인 운동 기록과 수치를 인용하며 칭찬/피드백
3. 일별 프로그램과 실제 운동을 매칭하여 이행도 언급
4. HYROX 레이스 관점에서 러닝 볼륨, 스테이션 연습, 강도 분배 분석
5. 디로드 주간: 볼륨보다 동작의 질과 회복 강조
6. 다음 주 구체적 목표 1-2개 제시
7. "파이팅!" 등으로 마무리
8. 각 피드백은 10-20줄 이내로 간결하게

[HYROX 레이스 구성 참고]
8라운드: 각 라운드 1km 달리기 + 기능성 운동 1종
8개 스테이션: SkiErg 1000m, Sled Push 50m, Sled Pull 50m, Burpee Broad Jump 80m, Rowing 1000m, Farmers Carry 200m, Sandbag Lunges 100m, Wall Ball 100회`;

function buildPrompt(
 userInfo: any,
 challenge: any,
 record: any,
 totalWeeks: number,
 workoutsText: string,
 prevCoachFeedback: string | null
): string {
 const age = calculateAge(userInfo?.birth);
 const gender = userInfo?.gender === 'MALE' ? '남성' : userInfo?.gender === 'FEMALE' ? '여성' : '알 수 없음';
 const restingHr = userInfo?.resting_heart_rate || '알 수 없음';
 const name = userInfo?.name || '알 수 없음';

 let prompt = `회원의 챌린지 W${record.week_number} (${record.start_date}~${record.end_date}) 주간 운동 기록을 분석하고 피드백을 작성해주세요.

회원 정보:
- 이름: ${name}
- 성별: ${gender}
- 나이: ${age}
- 안정시 심박수: ${restingHr}

챌린지 정보:
- 챌린지명: ${challenge.title}
- 현재 W${record.week_number} / 총 ${totalWeeks}주 (디로드 주간)
- HYROX ICN 2026 대회까지 약 5주

주간 운동 요약:
- 유산소 포인트: ${record.cardio_points_total?.toFixed(1) || '0.0'}pt
- 근력 운동: ${record.strength_sessions_count || 0}회

${WEEK4_PROGRAM}

일별 운동 기록:
${workoutsText}`;

 if (prevCoachFeedback) {
  prompt += `\n\n지난주(W${record.week_number - 1}) 코치 피드백 참고:
${prevCoachFeedback}`;
 }

 return prompt;
}

async function generateAiFeedback(prompt: string): Promise<string> {
 const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1500,
  messages: [
   { role: 'user', content: prompt },
  ],
  system: SYSTEM_PROMPT,
 });

 const textBlock = response.content.find((block) => block.type === 'text');
 return textBlock?.text || '';
}

async function upsertAiFeedback(weeklyRecordId: string, challengeId: string, aiFeedback: string) {
 const { data: existing } = await supabase
  .from('workout_feedbacks')
  .select('id')
  .eq('workout_weekly_records_id', weeklyRecordId)
  .single();

 if (existing) {
  const { error } = await supabase
   .from('workout_feedbacks')
   .update({
    ai_feedback: aiFeedback,
    updated_at: new Date().toISOString(),
   })
   .eq('id', existing.id);

  if (error) throw new Error(`Failed to update feedback: ${error.message}`);
 } else {
  const { error } = await supabase
   .from('workout_feedbacks')
   .insert({
    workout_weekly_records_id: weeklyRecordId,
    challenge_id: challengeId,
    ai_feedback: aiFeedback,
    coach_feedback: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
   });

  if (error) throw new Error(`Failed to insert feedback: ${error.message}`);
 }
}

async function main() {
 const { challengeId, week, dryRun } = parseArgs();

 console.log(`\n=== AI Workout Feedback Generator ===`);
 console.log(`Challenge ID: ${challengeId}`);
 console.log(`Week: ${week ?? 'all'}`);
 console.log(`Dry run: ${dryRun}\n`);

 const challenge = await getChallengeInfo(challengeId);
 console.log(`Challenge: ${challenge.title} (${challenge.start_date} ~ ${challenge.end_date})`);

 const totalWeeks = calculateTotalWeeks(challenge.start_date, challenge.end_date);
 const records = await getWeeklyRecords(challengeId, challenge.start_date, week);
 console.log(`Found ${records.length} weekly records to process\n`);

 let successCount = 0;
 let errorCount = 0;

 for (const record of records) {
  try {
   const userInfo = await getUserInfo(record.user_id);
   const userName = userInfo?.name || record.user_id;
   console.log(`--- ${userName} (W${record.week_number}, ${record.cardio_points_total}pt) ---`);

   const workouts = await getWeekWorkouts(
    record.user_id,
    `${record.start_date}T00:00:00`,
    `${record.end_date}T23:59:59`
   );

   const prevCoachFeedback = await getCoachFeedbackForPreviousWeek(
    challengeId, record.user_id, record.start_date
   );

   const workoutsText = formatWorkoutsForPrompt(workouts, record.start_date);
   const prompt = buildPrompt(userInfo, challenge, record, totalWeeks, workoutsText, prevCoachFeedback);

   const aiFeedback = await generateAiFeedback(prompt);

   if (dryRun) {
    console.log(aiFeedback);
    console.log('');
   } else {
    await upsertAiFeedback(record.id, challengeId, aiFeedback);
    console.log(`Saved AI feedback for ${userName}`);
   }

   successCount++;
  } catch (err) {
   console.error(`Error processing record ${record.id}:`, err);
   errorCount++;
  }
 }

 console.log(`\n=== Done ===`);
 console.log(`Success: ${successCount}, Errors: ${errorCount}`);
}

main().catch((err) => {
 console.error('Fatal error:', err);
 process.exit(1);
});
