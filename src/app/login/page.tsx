'use client';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import GoogleLoginButton from '@/components/buttons/google-login-button';

export default function Login() {
  const { theme } = useTheme();

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
      <GoogleLoginButton />
    </div>
  );
}
