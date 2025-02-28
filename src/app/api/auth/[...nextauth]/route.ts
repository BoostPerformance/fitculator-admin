import NextAuth from 'next-auth/next';
import type { NextAuthConfig } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { createClient } from '@supabase/supabase-js';

declare module 'next-auth' {
  interface Session {
    user: {
      email?: string | null;
      name?: string | null;
      image?: string | null;
      admin_role?: string;
      organization_id?: string;
      admin_user_id?: string;
      organization_name?: string;
    };
  }

  interface User {
    email?: string | null;
    name?: string | null;
    image?: string | null;
    admin_role?: string;
    organization_id?: string;
    admin_user_id?: string;
    organization_name?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    admin_role?: string;
    organization_id?: string;
    admin_user_id?: string;
    organization_name?: string;
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const authOptions: NextAuthConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user }) {
      try {
        if (!user.email) {
          console.error('No email provided');
          return false;
        }

        // console.log("🔍 Checking user in auth_users table:", user.email);
        // console.log("🌐 Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
        // console.log(
        //   "🔑 Supabase Key:",
        //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Present" : "Missing"
        // );

        // 1. auth_users 테이블에서 사용자 확인
        const { data: existingUser, error: userError } = await supabase
          .from('auth_users')
          .select('*')
          .eq('email', user.email)
          .single();

        if (userError && userError.code !== 'PGRST116') {
          // PGRST116는 결과가 없을 때의 에러
          console.error('❌ Error checking user:', userError);
          return false;
        }

        // 기존 사용자가 있으면 로그인 허용
        if (existingUser) {
          console.log('✅ Existing user found, allowing login');
          return true;
        }

        // 새로운 사용자면 auth_users 테이블에 추가
        //   console.log("📝 New user, creating record in auth_users");
        const { error: insertError } = await supabase
          .from('auth_users')
          .insert([
            {
              email: user.email,
              name: user.name,
              profile_image_url: user.image,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]);

        if (insertError) {
          console.error('❌ Error creating user:', insertError);
          return false;
        }

        // console.log('✅ New user created successfully');
        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      try {
        if (account && user) {
          // admin_users 테이블에서 관리자 정보 가져오기
          const { data: adminUser, error: adminError } = await supabase
            .from('admin_users')
            .select('*, organizations (*)')
            .eq('email', user.email)
            .single();

          if (adminError) {
            console.error('Error fetching admin user:', adminError);
            return token;
          }

          if (adminUser) {
            token.admin_role = adminUser.admin_role;
            token.organization_id = adminUser.organization_id;
            token.admin_user_id = adminUser.id;
            token.organization_name = adminUser.organizations?.name;
          }
        }
        return token;
      } catch (error) {
        console.error('Error in jwt callback:', error);
        return token;
      }
    },

    async session({ session, token }) {
      try {
        if (session.user) {
          session.user.admin_role = token.admin_role;
          session.user.organization_id = token.organization_id;
          session.user.admin_user_id = token.admin_user_id;

          if (token.admin_role === 'coach') {
            const { data: coachData, error: coachError } = await supabase
              .from('coaches')
              .select('*')
              .eq('admin_user_id', token.admin_user_id)
              .single();

            if (!coachError && coachData) {
              session.user.image = coachData.profile_image_url;
            }
          }
        }
        return session;
      } catch (error) {
        console.error('Error in session callback:', error);
        return session;
      }
    },
  },
  events: {
    async signIn({ user }) {
      try {
        // 로그인 시 사용자 정보 업데이트
        if (user.email) {
          await supabase
            .from('auth_users')
            .update({ updated_at: new Date().toISOString() })
            .eq('email', user.email);
        }
      } catch (error) {
        console.error('Error in signIn event:', error);
      }
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
