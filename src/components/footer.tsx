import Button from '@/components/buttons/button';

interface HeaderProps {
  btnClassName?: string;
}

export default function Footer({ btnClassName }: HeaderProps) {
  return (
    <div
      className={`p-[2rem] w-full flex justify-center dark:bg-blue-4 bg-white
      `}
    >
      <Button className={btnClassName} />
    </div>
  );
}
