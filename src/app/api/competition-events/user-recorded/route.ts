import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { Session } from 'next-auth';

const supabase = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
 try {
 const session = (await getServerSession(authOptions)) as Session;

 if (!session?.user?.email) {
 return NextResponse.json(
 { error: 'Not authenticated', type: 'AuthError' },
 { status: 401 }
 );
 }

 const { data: adminUser, error: adminError } = await supabase
 .from('admin_users')
 .select('*')
 .eq('email', session.user.email)
 .single();

 if (adminError || !adminUser) {
 return NextResponse.json(
 { error: 'Admin user not found', type: 'NotFoundError' },
 { status: 404 }
 );
 }

 const { searchParams } = new URL(request.url);
 const type = searchParams.get('type');

 // competitions 테이블에서 event_id IS NULL 레코드 + 유저 이름 join
 const { data, error } = await supabase
 .from('competitions')
 .select('competition_type, event_name_en, event_name_ko, event_date, event_location, users(name)')
 .is('event_id', null);

 if (error) {
 return NextResponse.json(
 {
 error: 'Failed to fetch user-recorded competitions',
 details: error.message,
 type: 'QueryError',
 },
 { status: 500 }
 );
 }

 // 클라이언트 측 그룹핑 (Supabase JS는 GROUP BY 미지원)
 const groups = new Map<
 string,
 {
 competition_type: string;
 event_name_en: string | null;
 event_name_ko: string | null;
 record_count: number;
 first_recorded: string | null;
 last_recorded: string | null;
 users: string[];
 locations: string[];
 }
 >();

 for (const row of data || []) {
 // 이름이 둘 다 없으면 스킵
 if (!row.event_name_en && !row.event_name_ko) continue;

 // type 필터
 if (type && type !== 'all' && row.competition_type !== type) continue;

 const key = `${row.competition_type}||${row.event_name_en || ''}||${row.event_name_ko || ''}`;
 const userName = (row.users as { name: string | null } | null)?.name;

 const location = row.event_location as string | null;

 const existing = groups.get(key);
 if (existing) {
 existing.record_count++;
 if (userName && !existing.users.includes(userName)) {
 existing.users.push(userName);
 }
 if (location && !existing.locations.includes(location)) {
 existing.locations.push(location);
 }
 if (row.event_date) {
 if (!existing.first_recorded || row.event_date < existing.first_recorded) {
 existing.first_recorded = row.event_date;
 }
 if (!existing.last_recorded || row.event_date > existing.last_recorded) {
 existing.last_recorded = row.event_date;
 }
 }
 } else {
 groups.set(key, {
 competition_type: row.competition_type,
 event_name_en: row.event_name_en,
 event_name_ko: row.event_name_ko,
 record_count: 1,
 first_recorded: row.event_date,
 last_recorded: row.event_date,
 users: userName ? [userName] : [],
 locations: location ? [location] : [],
 });
 }
 }

 // record_count 내림차순 정렬
 const result = Array.from(groups.values()).sort(
 (a, b) => b.record_count - a.record_count
 );

 return NextResponse.json(result);
 } catch (error) {
 return NextResponse.json(
 {
 error: 'Internal server error',
 details: error instanceof Error ? error.message : 'Unknown error',
 type: 'GlobalError',
 },
 { status: 500 }
 );
 }
}
