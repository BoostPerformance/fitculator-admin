import Image from 'next/image';
interface LoadingProps {
 ismessage?: boolean;
}
export default function Loading({ ismessage }: LoadingProps) {
 return (
 <div className="flex flex-col justify-center items-center h-screen">
 <Image
 src="/image/logo-2.png"
 alt="로딩중 로고"
 width={50}
 height={50}
 className="animate-pulse"
 />
 {ismessage && (
 <div className="py-[2rem] text-headline-lg">Loading</div>
 )}
 </div>
 );
}
