'use client';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface ButtonProps {
  className?: string;
}

export default function DarkModeButton({ className }: ButtonProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userTheme = localStorage.getItem('theme') || 'light';

    setTheme(userTheme);
  }, [setTheme]);

  if (!mounted) return null;

  return (
    <>
      <button
        className={`text-1.25-900 ${className}`}
        onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
      >
        {theme === 'light' ? (
          <Image src="/svg/dark-mode.svg" alt="" width={30} height={30} loading="lazy" />
        ) : (
          <Image src="/svg/light-mode.svg" alt="" width={30} height={30} loading="lazy" />
        )}
      </button>
    </>
  );
}
