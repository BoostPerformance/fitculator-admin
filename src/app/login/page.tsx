'use client';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import GoogleButton from '@/components/buttons/googleButton';
import { signIn, useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Login() {
  const { setTheme, resolvedTheme } = useTheme();
  const { data: session } = useSession();
  if (session) {
    redirect('/user');
  }
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const logoTheme = localStorage.getItem('theme') || 'light';
    setTheme(logoTheme);
  }, [setTheme]);

  if (!mounted) return null;

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
      <GoogleButton onClick={() => signIn('google')} />
    </div>
  );
}
