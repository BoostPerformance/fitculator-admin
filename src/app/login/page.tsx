'use client';
import Image from 'next/image';
import { useTheme } from '@/context/theme-context';
import GoogleLoginButton from '@/components/buttons/google-login-button';

export default function Login() {
  const { isDark } = useTheme();
  return (
    <div
      className={`flex flex-col justify-center items-center py-[12rem] ${
        isDark === true ? 'bg-black' : 'bg-white'
      }`}
    >
      <div className="flex justify-center items-center h-[10rem]">
        <Image
          src={`/image/${isDark === true ? 'logo-dark' : 'logo'}.png`}
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
