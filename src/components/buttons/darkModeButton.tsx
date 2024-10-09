'use client';
import { useTheme } from 'next-themes';
import Image from 'next/image';

interface ButtonProps {
  className?: string;
}

export default function DarkModeButton({ className }: ButtonProps) {
  const { theme, setTheme } = useTheme();
  return (
    <>
      <button
        className={`text-1.25-900 ${className}`}
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        <Image
          src="/svg/dark-mode.svg"
          alt=""
          width={30}
          height={30}
          className={`${theme === 'dark' ? 'invert' : ''}`}
        />
      </button>
    </>
  );
}
