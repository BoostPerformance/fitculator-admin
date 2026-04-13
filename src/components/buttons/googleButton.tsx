import Image from 'next/image';

interface GoogleLoginProps {
 onClick: () => void;
}
export default function GoogleButton({ onClick }: GoogleLoginProps) {
 const handleClick = () => {
 // console.log('🔄 === Google Button Click ===');
 // console.log('📥 Initiating Google sign in...');
 onClick();
 };

 return (
 <button
 className="flex gap-[0.5rem] items-center justify-center border-line border-[0.12rem] rounded-[0.3rem] py-3 px-4 text-base font-medium text-content-primary"
 onClick={handleClick}
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
