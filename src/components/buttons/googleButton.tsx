import Image from 'next/image';

interface GoogleLoginProps {
  onClick: () => void;
}
export default function GoogleButton({ onClick }: GoogleLoginProps) {
  return (
    <button
      className="flex gap-[0.5rem] items-center border-gray-7 border-[0.12rem] rounded-[0.3rem] p-[0.4rem] text-0.75-500 text-black dark:text-gray-9"
      onClick={onClick}
    >
      <Image
        src="/svg/google-logo.svg"
        alt="google logo"
        width={20}
        height={30}
      />
      Continue with Google
    </button>
  );
}
