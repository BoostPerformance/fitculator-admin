"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface LoadingProps {
 ismessage?: boolean;
}
export default function Loading({ ismessage }: LoadingProps) {
 const [dotCount, setDotCount] = useState(0);

 useEffect(() => {
 if (!ismessage) return;
 const interval = setInterval(() => {
  setDotCount(prev => (prev + 1) % 4);
 }, 400);
 return () => clearInterval(interval);
 }, [ismessage]);

 return (
 <div className="flex flex-col justify-center items-center h-screen">
 <Image
  src="/image/logo-2.png"
  alt="Fitculator Logo"
  width={50}
  height={50}
  className="animate-pulse dark:invert dark:hue-rotate-180"
 />
 {ismessage && (
  <div className="py-[2rem] text-sm text-content-secondary">
  Loading<span className="inline-block w-[1rem] text-left">{'.'.repeat(dotCount)}</span>
  </div>
 )}
 </div>
 );
}
