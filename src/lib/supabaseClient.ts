import { createClient } from '@supabase/supabase-js';

// .env.local 파일에서 환경 변수를 불러옵니다
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
//const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and anon key must be provided');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
