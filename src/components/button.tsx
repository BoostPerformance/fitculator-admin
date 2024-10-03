'use client';
import { useTheme } from '@/context/theme-context';
import Image from 'next/image';

interface ButtonProps {
  className?: string;
}

export default function Button({ className }: ButtonProps) {
  const { isDark, toggleTheme } = useTheme();
  return (
    <>
      <button className={`text-1.25-900 ${className}`} onClick={toggleTheme}>
        <Image
          src="svg/dark-mode.svg"
          alt=""
          width={30}
          height={30}
          className={`${isDark ? 'invert' : ''}`}
        />
      </button>
    </>
  );
}
