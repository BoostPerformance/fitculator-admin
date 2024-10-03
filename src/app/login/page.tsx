'use client';
import Image from 'next/image';
import { useTheme } from '@/context/theme-context';

export default function Login() {
  const { isDark } = useTheme();
  return (
    <div
      className={`flex flex-col justify-center items-center pb-[5rem] ${
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
      <button>
        <Image
          src={`/image/${
            isDark === true ? 'google-login-dark' : 'google-login'
          }.png`}
          alt="logo"
          width={100}
          height={100}
          className="w-[10rem]"
        />
      </button>
    </div>
  );
}
