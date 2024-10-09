import DarkModeButton from '@/components/buttons/darkModeButton';

interface HeaderProps {
  btnClassName?: string;
}

export default function Footer({ btnClassName }: HeaderProps) {
  return (
    <footer
      className={`p-[2rem] w-full flex justify-center dark:bg-blue-4 bg-white h-[10rem] bottom-0
      `}
    >
      <DarkModeButton className={btnClassName} />
    </footer>
  );
}
