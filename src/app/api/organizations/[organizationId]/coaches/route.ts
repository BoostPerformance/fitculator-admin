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
 { params }: { params: Promise<{ organizationId: string }> }
) {
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

 const { organizationId } = await params;

 const { data: coaches, error: coachesError } = await supabase
 .from('coaches')
 .select(`
 id,
 admin_user_id,
 organization_id,
 profile_image_url,
 is_active,
 admin_users!admin_user_id (
 id,
 username,
 email,
 admin_role
 )
 `)
 .eq('organization_id', organizationId)
 .eq('is_active', true);

 if (coachesError) {
 return NextResponse.json(
 {
 error: '코치 목록을 가져오는데 실패했습니다.',
 details: coachesError.message,
 type: 'CoachesQueryError',
 },
 { status: 500 }
 );
 }

 const formattedCoaches = (coaches || []).map((coach: any) => {
 const adminUserData = Array.isArray(coach.admin_users)
 ? coach.admin_users[0]
 : coach.admin_users;
 return {
 id: coach.id,
 admin_user_id: coach.admin_user_id,
 organization_id: coach.organization_id,
 profile_image_url: coach.profile_image_url,
 username: adminUserData?.username || '',
 email: adminUserData?.email || '',
 admin_role: adminUserData?.admin_role || '',
 };
 });

 return NextResponse.json(formattedCoaches);
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

export async function POST(
 request: Request,
 { params }: { params: Promise<{ organizationId: string }> }
) {
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

 const { organizationId } = await params;
 const body = await request.json();

 if (!body.email || body.email.trim() === '') {
 return NextResponse.json(
 { error: '이메일은 필수입니다.', type: 'ValidationError' },
 { status: 400 }
 );
 }

 // 이메일로 admin_user 조회
 const { data: existingAdminUser } = await supabase
 .from('admin_users')
 .select('id, email, username, admin_role')
 .eq('email', body.email.trim())
 .single();

 let targetAdminUser = existingAdminUser;

 // admin_user가 없으면 auth_users → admin_users 순서로 생성
 if (!targetAdminUser) {
 const email = body.email.trim();
 const username = body.username?.trim() || email.split('@')[0];

 // 1. auth_users 확인 또는 생성
 const { data: existingAuthUser } = await supabase
 .from('auth_users')
 .select('id')
 .eq('email', email)
 .single();

 let authUserId = existingAuthUser?.id;

 if (!authUserId) {
 const { data: newAuthUser, error: authError } = await supabase
 .from('auth_users')
 .insert({
 email,
 created_at: new Date().toISOString(),
 updated_at: new Date().toISOString(),
 })
 .select('id')
 .single();

 if (authError || !newAuthUser) {

 return NextResponse.json(
 {
 error: 'auth 사용자 생성에 실패했습니다.',
 details: authError?.message,
 type: 'CreateError',
 },
 { status: 500 }
 );
 }
 authUserId = newAuthUser.id;
 }

 // 2. admin_users 생성 (auth_user_id 연결)
 const { data: newAdminUser, error: createAdminError } = await supabase
 .from('admin_users')
 .insert({
 email,
 username,
 admin_role: 'coach',
 organization_id: organizationId,
 auth_user_id: authUserId,
 is_active: true,
 })
 .select('id, email, username, admin_role')
 .single();

 if (createAdminError || !newAdminUser) {

 return NextResponse.json(
 {
 error: '관리자 사용자 생성에 실패했습니다.',
 details: createAdminError?.message,
 type: 'CreateError',
 },
 { status: 500 }
 );
 }

 targetAdminUser = newAdminUser;
 }

 // 이미 이 조직에 코치로 등록되어 있는지 확인
 const { data: existingCoach } = await supabase
 .from('coaches')
 .select('id, is_active')
 .eq('admin_user_id', targetAdminUser.id)
 .eq('organization_id', organizationId)
 .single();

 if (existingCoach) {
 if (existingCoach.is_active) {
 return NextResponse.json(
 { error: '이미 이 조직에 등록된 코치입니다.', type: 'DuplicateError' },
 { status: 409 }
 );
 }

 // 비활성화된 코치가 있으면 재활성화
 const { data: reactivatedCoach, error: reactivateError } = await supabase
 .from('coaches')
 .update({ is_active: true })
 .eq('id', existingCoach.id)
 .select()
 .single();

 if (reactivateError) {
 return NextResponse.json(
 {
 error: '코치 재활성화에 실패했습니다.',
 details: reactivateError.message,
 type: 'UpdateError',
 },
 { status: 500 }
 );
 }

 return NextResponse.json({
 id: reactivatedCoach.id,
 admin_user_id: targetAdminUser.id,
 organization_id: organizationId,
 profile_image_url: reactivatedCoach.profile_image_url,
 username: targetAdminUser.username,
 email: targetAdminUser.email,
 admin_role: targetAdminUser.admin_role,
 });
 }

 // 새 코치 레코드 생성
 const { data: newCoach, error: createError } = await supabase
 .from('coaches')
 .insert({
 admin_user_id: targetAdminUser.id,
 organization_id: organizationId,
 is_active: true,
 })
 .select()
 .single();

 if (createError) {

 return NextResponse.json(
 {
 error: '코치 추가에 실패했습니다.',
 details: createError.message,
 type: 'CreateError',
 },
 { status: 500 }
 );
 }

 return NextResponse.json({
 id: newCoach.id,
 admin_user_id: targetAdminUser.id,
 organization_id: organizationId,
 profile_image_url: newCoach.profile_image_url,
 username: targetAdminUser.username,
 email: targetAdminUser.email,
 admin_role: targetAdminUser.admin_role,
 });
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

export async function DELETE(
 request: Request,
 { params }: { params: Promise<{ organizationId: string }> }
) {
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

 const { organizationId } = await params;
 const body = await request.json();

 if (!body.coach_id) {
 return NextResponse.json(
 { error: '코치 ID는 필수입니다.', type: 'ValidationError' },
 { status: 400 }
 );
 }

 // 코치 비활성화 (soft delete)
 const { error: deleteError } = await supabase
 .from('coaches')
 .update({ is_active: false })
 .eq('id', body.coach_id)
 .eq('organization_id', organizationId);

 if (deleteError) {
 return NextResponse.json(
 {
 error: '코치 삭제에 실패했습니다.',
 details: deleteError.message,
 type: 'DeleteError',
 },
 { status: 500 }
 );
 }

 return NextResponse.json({ success: true });
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
