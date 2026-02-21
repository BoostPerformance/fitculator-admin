'use client';

import { LoadingSkeleton } from '@/components/layout/skeleton';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
 const { data: session, status } = useSession();
 const router = useRouter();

 useEffect(() => {
 // console.log("🔄 Home page useEffect");
 // console.log("📊 Session status:", status);
 // console.log("📊 Session data:", session);

 if (status === 'loading') {
 // console.log('⏳ Session is loading...');
 return;
 }

 if (session) {
 // console.log('✅ Redirecting to /user');
 router.push('/user');
 return;
 }

 // console.log("❌ Redirecting to /login");
 router.push('/login');
 }, [session, status, router]);

 return <LoadingSkeleton />;
}
