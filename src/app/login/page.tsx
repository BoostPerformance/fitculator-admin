'use client';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import GoogleButton from '@/components/buttons/googleButton';
import { signIn, useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function Login() {
  const { theme } = useTheme();
  const { data: session } = useSession();
  if (session) {
    redirect('/user');
  }

  return (
    <div
      className={`flex flex-col justify-center items-center py-[12rem] dark:bg-blue-4`}
    >
      <div className="flex justify-center items-center h-[10rem]">
        <Image
          src={`/image/${theme === 'dark' ? 'logo-dark' : 'logo'}.png`}
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
