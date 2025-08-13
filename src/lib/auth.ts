import type { NextAuthConfig } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { createClient } from '@supabase/supabase-js';

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

        const { data: existingUser, error: userError } = await supabase
          .from('auth_users')
          .select('*')
          .eq('email', user.email)
          .single();

        if (userError && userError.code !== 'PGRST116') {
          console.error('❌ Error checking user:', userError);
          return false;
        }

        if (existingUser) {
          return true;
        }

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

        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      try {
        if (account && user) {
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

          if (
            token.admin_role === 'coach' ||
            token.admin_role === 'internal_operator'
          ) {
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