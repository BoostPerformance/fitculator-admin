import Image from 'next/image';

export default function GoogleLoginButton() {
  return (
    <div className="flex gap-[0.5rem] items-center border-gray-7 border-[0.12rem] rounded-[0.3rem] p-[0.4rem] ">
      <Image
        src="/svg/google-logo.svg"
        alt="google logo"
        width={20}
        height={30}
      />
      <h1 className="text-0.75-500 text-black dark:text-gray-9">
        Continue with Google
      </h1>
    </div>
  );
}
