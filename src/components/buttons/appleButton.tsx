import Image from 'next/image';

interface AppleLoginProps {
 onClick: () => void;
}
export default function AppleButton({ onClick }: AppleLoginProps) {
 return (
  <button
   className="flex gap-[0.5rem] items-center border-line border-[0.12rem] rounded-[0.3rem] p-[0.4rem] text-label font-medium text-content-primary"
   onClick={onClick}
  >
   <Image
    src="/svg/apple-logo.svg"
    alt="apple logo"
    width={20}
    height={30}
   />
   Continue with Apple
  </button>
 );
}
