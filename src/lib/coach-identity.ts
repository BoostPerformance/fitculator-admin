import supabaseAdmin from './supabase-admin';

export interface CoachIdentity {
 adminUserId: string;
 coachId: string;
 userId: string; // users.id (앱에서 사용하는 실제 유저 ID)
}

// 메모리 캐시 (서버 인스턴스 수명 동안 유지)
const cache = new Map<string, { data: CoachIdentity | null; expiry: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10분

/**
 * 어드민 이메일로부터 코치의 users.id를 해석
 * 매핑 체인: admin_users.email → coaches + auth_users → users.id
 */
export async function resolveCoachIdentity(
 email: string
): Promise<CoachIdentity | null> {
 const cached = cache.get(email);
 if (cached && Date.now() < cached.expiry) {
  return cached.data;
 }

 // 1. admin_users에서 조회
 const { data: adminUser } = await supabaseAdmin
  .from('admin_users')
  .select('id, auth_user_id')
  .eq('email', email)
  .single();

 if (!adminUser) {
  cache.set(email, { data: null, expiry: Date.now() + CACHE_TTL });
  return null;
 }

 // 2. coaches + auth_users 병렬 조회
 const [coachResult, authResult] = await Promise.all([
  supabaseAdmin
   .from('coaches')
   .select('id')
   .eq('admin_user_id', adminUser.id)
   .single(),
  supabaseAdmin
   .from('auth_users')
   .select('user_id')
   .eq('id', adminUser.auth_user_id)
   .single(),
 ]);

 if (!coachResult.data || !authResult.data?.user_id) {
  cache.set(email, { data: null, expiry: Date.now() + CACHE_TTL });
  return null;
 }

 const identity: CoachIdentity = {
  adminUserId: adminUser.id,
  coachId: coachResult.data.id,
  userId: authResult.data.user_id,
 };

 cache.set(email, { data: identity, expiry: Date.now() + CACHE_TTL });
 return identity;
}
