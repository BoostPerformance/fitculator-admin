import DarkModeButton from '@/components/buttons/darkModeButton';

interface HeaderProps {
  btnClassName?: string;
}

export default function Footer({ btnClassName }: HeaderProps) {
  return (
    <footer
      className={`p-[1rem] w-full flex justify-center dark:bg-blue-4 bg-white sm:bg-[#E4E9FF] bottom-0 z-50`}
    >
      <DarkModeButton className={btnClassName} />
    </footer>
  );
}
