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

export async function GET(
 request: Request,
 { params }: { params: Promise<{ eventId: string }> }
) {
 try {
 const { eventId } = await params;
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

 const { data: mappings, error: fetchError } = await supabase
 .from('competition_event_race_types')
 .select('race_type_id, sort_order, marathon_race_types(*)')
 .eq('event_id', eventId)
 .order('sort_order');

 if (fetchError) {
 return NextResponse.json(
 {
 error: '종목 매핑을 가져오는데 실패했습니다.',
 details: fetchError.message,
 type: 'QueryError',
 },
 { status: 500 }
 );
 }

 return NextResponse.json(mappings);
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

export async function PUT(
 request: Request,
 { params }: { params: Promise<{ eventId: string }> }
) {
 try {
 const { eventId } = await params;
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
 const raceTypeIds: string[] = body.race_type_ids || [];

 // Delete existing mappings
 const { error: deleteError } = await supabase
 .from('competition_event_race_types')
 .delete()
 .eq('event_id', eventId);

 if (deleteError) {
 return NextResponse.json(
 {
 error: '기존 매핑 삭제에 실패했습니다.',
 details: deleteError.message,
 type: 'DeleteError',
 },
 { status: 500 }
 );
 }

 // Insert new mappings
 if (raceTypeIds.length > 0) {
 const rows = raceTypeIds.map((raceTypeId: string, index: number) => ({
 event_id: eventId,
 race_type_id: raceTypeId,
 sort_order: index,
 }));

 const { error: insertError } = await supabase
 .from('competition_event_race_types')
 .insert(rows);

 if (insertError) {
 return NextResponse.json(
 {
 error: '종목 매핑 저장에 실패했습니다.',
 details: insertError.message,
 type: 'InsertError',
 },
 { status: 500 }
 );
 }
 }

 return NextResponse.json({ success: true, count: raceTypeIds.length });
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
