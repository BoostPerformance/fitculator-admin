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
        width={100}
        height={100}
        className="animate-spin"
      />
      {ismessage && (
        <div className="py-[2rem] text-1.5-400">잠시만 기다려주세요</div>
      )}
    </div>
  );
}
