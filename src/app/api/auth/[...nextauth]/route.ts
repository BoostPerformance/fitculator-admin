import NextAuth from 'next-auth/next';
import { authOptions } from '@/lib/auth';

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
}

declare module 'next-auth/jwt' {
  interface JWT {
    admin_role?: string;
    organization_id?: string;
    admin_user_id?: string;
    organization_name?: string;
  }
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
