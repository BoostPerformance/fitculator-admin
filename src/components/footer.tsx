'use client';
import { useTheme } from '@/context/theme-context';
import Button from '@/components/buttons/button';

interface HeaderProps {
  btnClassName?: string;
}

export default function Footer({ btnClassName }: HeaderProps) {
  const { isDark } = useTheme();
  return (
    <div
      className={`p-[2rem] w-full flex justify-center ${
        isDark ? 'bg-black' : 'bg-white'
      }`}
    >
      <Button className={btnClassName} />
    </div>
  );
}
