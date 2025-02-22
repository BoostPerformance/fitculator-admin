'use client';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import GoogleButton from '@/components/buttons/googleButton';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Login() {
  console.log('🔄 === Login Page Render Start ===');
  const { setTheme, resolvedTheme } = useTheme();
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    console.log('🔄 Login Page useEffect - Theme');
    const logoTheme = localStorage.getItem('theme') || 'light';
    setTheme(logoTheme);
  }, [setTheme]);

  useEffect(() => {
    console.log('🔄 Login Page useEffect - Session');
    console.log('📊 Session status:', status);
    console.log('📊 Session data:', session);

    if (status === 'loading') {
      console.log('⏳ Session is loading...');
      return;
    }

    if (session) {
      console.log('✅ Already logged in, redirecting to /user');
      router.push('/user');
    }
  }, [session, status, router]);

  const handleGoogleSignIn = async () => {
    console.log('📤 Initiating Google Sign In');
    try {
      await signIn('google', { 
        callbackUrl: '/user',
        redirect: true
      });
    } catch (error) {
      console.error('❌ Sign in error:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col justify-center items-center py-[12rem] dark:bg-blue-4`}
    >
      <div className="flex justify-center items-center h-[10rem]">
        <Image
          src={`/image/${resolvedTheme === 'light' ? 'logo' : 'logo-dark'}.png`}
          alt="logo"
          width={100}
          height={100}
          className="w-[8rem]"
        />
      </div>
      <GoogleButton onClick={handleGoogleSignIn} />
    </div>
  );
}
