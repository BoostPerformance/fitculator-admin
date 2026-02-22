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

export async function GET() {
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

 const { data: raceTypes, error: fetchError } = await supabase
 .from('marathon_race_types')
 .select('*')
 .order('distance_km', { ascending: false, nullsFirst: false });

 if (fetchError) {
 return NextResponse.json(
 {
 error: '종목 데이터를 가져오는데 실패했습니다.',
 details: fetchError.message,
 type: 'QueryError',
 },
 { status: 500 }
 );
 }

 return NextResponse.json(raceTypes);
 } catch (error) {
 return NextResponse.json(
 {
 error: '서버 내부 오류',
 details: error instanceof Error ? error.message : '알 수 없는 오류',
 type: 'GlobalError',
 },
 { status: 500 }
 );
 }
}

export async function POST(request: Request) {
 try {
 const session = (await getServerSession(authOptions)) as Session;

 if (!session?.user?.email) {
 return NextResponse.json(
 { error: '인증되지 않은 사용자입니다.', type: 'AuthError' },
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
 { error: '관리자 사용자를 찾을 수 없습니다.', type: 'NotFoundError' },
 { status: 404 }
 );
 }

 const body = await request.json();

 if (!body.key || !body.label_en || !body.label_ko) {
 return NextResponse.json(
 { error: 'key, label_en, label_ko는 필수입니다.', type: 'ValidationError' },
 { status: 400 }
 );
 }

 const { data: newRaceType, error: createError } = await supabase
 .from('marathon_race_types')
 .insert({
 key: body.key.trim().toLowerCase(),
 distance_km: body.distance_km || null,
 label_en: body.label_en.trim(),
 label_ko: body.label_ko.trim(),
 sort_order: body.sort_order ?? 0,
 is_active: body.is_active !== undefined ? body.is_active : true,
 })
 .select()
 .single();

 if (createError) {
 return NextResponse.json(
 {
 error: '종목 생성에 실패했습니다.',
 details: createError.message,
 type: 'CreateError',
 },
 { status: 500 }
 );
 }

 return NextResponse.json(newRaceType);
 } catch (error) {
 return NextResponse.json(
 {
 error: '서버 내부 오류',
 details: error instanceof Error ? error.message : '알 수 없는 오류',
 type: 'GlobalError',
 },
 { status: 500 }
 );
 }
}
