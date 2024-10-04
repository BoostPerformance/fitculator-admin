import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId:
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
        'no NEXT_PUBLIC_GOOGLE_CLIENT_ID',
      clientSecret:
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET ||
        'no NEXT_PUBLIC_GOOGLE_CLIENT_SECRET ',
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET, // 이 값을 환경변수에 추가하세요
});

export { handler as GET, handler as POST };
