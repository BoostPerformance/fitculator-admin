import Image from 'next/image';

interface AppleLoginProps {
 onClick: () => void;
}
export default function AppleButton({ onClick }: AppleLoginProps) {
 return (
  <button
   className="flex gap-[0.5rem] items-center justify-center border-line border-[0.12rem] rounded-[0.3rem] py-3 px-4 text-base font-medium text-content-primary"
   onClick={onClick}
  >
   <Image
    src="/svg/apple-logo.svg"
    alt="apple logo"
    width={24}
    height={24}
   />
   Continue with Apple
  </button>
 );
}
