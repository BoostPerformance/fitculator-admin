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
        {theme === 'light' ? (
          <Image src="/svg/dark-mode.svg" alt="" width={30} height={30} />
        ) : (
          <Image src="/svg/light-mode.svg" alt="" width={30} height={30} />
        )}
      </button>
    </>
  );
}
