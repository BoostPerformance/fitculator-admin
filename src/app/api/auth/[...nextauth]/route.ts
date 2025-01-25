import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { createClient } from '@supabase/supabase-js';
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      email: string;
      name?: string;
      image?: string;
      admin_role?: string; // 추가
      organization_id?: string; // 추가
      admin_user_id?: string; // 추가
    };
  }
}

declare module 'next-auth' {
  interface JWT {
    role?: string;
    organization_id?: string;
    admin_user_id?: string;
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  pages: {
    signIn: '/user',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        console.log('No email provided');
        return false;
      }

      const { data: authUser, error: authError } = await supabase
        .from('auth_users')
        .select('email')
        .eq('email', user.email);

      // console.log('user.email', user.email, authUser);

      if (authError) {
        console.log(authError);
        return false;
      }
      if (authUser.length === 0) {
        console.log('authUser', authUser);
        return false;
      }

      // admin_users 확인
      const { data: adminUser } = await supabase
        .from('auth_users')
        .select('email')
        .eq('email', user.email);

      // console.log('adminUser', adminUser, user.email);
      return !!adminUser;
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        // 구글 로그인 성공 시 토큰에 정보 저장
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', user.email)
          .single();

        if (adminUser) {
          token.role = adminUser.admin_role;
          token.organization_id = adminUser.organization_id;
          token.admin_user_id = adminUser.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user?.email) {
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', session.user.email)
          .single();

        if (adminUser) {
          session.user.name = adminUser.admin_role;
          session.user.organization_id = adminUser.organization_id;
          session.user.admin_user_id = adminUser.id;
          session.user.admin_role = adminUser.admin_role;
          session.user.email = adminUser.email;
        }

        if (adminUser.admin_role === 'coach') {
          const { data: coachUser, error } = await supabase
            .from('coaches')
            .select('profile_image_url')
            .eq('admin_user_id', adminUser.id)
            .single();

          if (coachUser && !error) {
            session.user.image = coachUser.profile_image_url;
          }
        }
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
