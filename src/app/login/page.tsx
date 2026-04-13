'use client';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import GoogleButton from '@/components/buttons/googleButton';
import AppleButton from '@/components/buttons/appleButton';
import Loading from '@/components/layout/loading';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Login() {
 // console.log('🔄 === Login Page Render Start ===');
 const { setTheme, resolvedTheme } = useTheme();
 const { data: session, status } = useSession();
 const router = useRouter();

 useEffect(() => {
 const savedTheme = localStorage.getItem('theme');
 setTheme(savedTheme || 'system');
 }, [setTheme]);

 useEffect(() => {
 // KakaoTalk 브라우저 감지 및 Chrome 리다이렉트
 if (typeof window !== 'undefined') {
 const userAgent = navigator.userAgent;
 if (userAgent.includes('KAKAOTALK')) {
 const currentUrl = window.location.href;
 const chromeUrl = `intent://${currentUrl.replace(/https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
 window.location.href = chromeUrl;
 }
 }
 }, []);

 useEffect(() => {
 // console.log('🔄 Login Page useEffect - Session');
 // console.log('📊 Session status:', status);
 // console.log('📊 Session data:', session);

 if (status === 'loading') {
 // console.log('⏳ Session is loading...');
 return;
 }

 if (session) {
 // console.log('✅ Already logged in, redirecting to /user');
 router.push('/user');
 }
 }, [session, status, router]);

 const handleGoogleSignIn = async () => {
 // console.log('📤 Initiating Google Sign In');
 try {
 await signIn('google', {
 callbackUrl: '/user',
 redirect: true,
 });
 } catch (error) {
// console.error('❌ Sign in error:', error);
 }
 };

 const handleAppleSignIn = async () => {
 try {
 await signIn('apple', {
 callbackUrl: '/user',
 redirect: true,
 });
 } catch (error) {
// console.error('❌ Apple sign in error:', error);
 }
 };

 if (status === 'loading') {
 return <Loading ismessage={true} />;
 }

 return (
 <div
 className="flex flex-col justify-center items-center min-h-screen py-12 sm:py-[12rem] px-4"
 >
 <div className="flex flex-col items-center h-32 sm:h-[10rem] mb-6 sm:mb-0 justify-center">
 <div className="flex items-center gap-3">
  <Image
  src={`/svg/logo_${resolvedTheme === 'dark' ? 'dark' : 'light'}.svg`}
  alt="logo icon"
  width={32}
  height={32}
  className="w-8 sm:w-10"
  />
  <Image
  src={`/svg/logo_text_${resolvedTheme === 'dark' ? 'dark' : 'light'}.svg`}
  alt="logo"
  width={200}
  height={24}
  className="w-48 sm:w-[14rem]"
  />
 </div>
 <span className="text-xs font-light tracking-[0.3em] uppercase text-content-secondary mt-4" style={{ fontFamily: 'system-ui, sans-serif' }}>admin</span>
 </div>
 <div className="w-full max-w-xs sm:max-w-none flex flex-col gap-3">
 <GoogleButton onClick={handleGoogleSignIn} />
 <AppleButton onClick={handleAppleSignIn} />
 </div>
 </div>
 );
}
