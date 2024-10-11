import Image from 'next/image';

interface TextBoxProps {
  title: string;
  inputbox: string;
  content?: string;
  button1: string;
  button2?: string;
  onClick?: () => void;
  className?: string;
}

const TextBox = ({
  title,
  inputbox,
  button1,
  button2,
  onClick,
  className,
}: TextBoxProps) => {
  return (
    <div className="mt-[2rem] p-[1rem] border rounded-md">
      <h4 className="text-1.375-700 font-semibold mb-2 flex items-center">
        {title}
        <button className="ml-2 text-[1rem]">
          <Image
            src="/svg/copyIcon.svg"
            alt="copy icon"
            width={17}
            height={17}
          />
        </button>
      </h4>
      <div className="flex flex-col items-end">
        <input
          type="text"
          placeholder={inputbox}
          className="border p-2 w-full rounded-md text-0.875-400 h-[8rem] top-0"
        />
        <div className="flex gap-[1rem]">
          <button
            className={`${className} bg-[#FF9257] text-white rounded-md  text-0.875-400 mt-[0.5rem] w-[5.5rem] h-[2rem]`}
            onClick={onClick}
          >
            {button1}
          </button>
          {button2 && (
            <button className="bg-[#48BA5D] text-white rounded-md h-[2rem] w-[5.5rem] text-0.875-400 mt-[0.5rem]">
              {button2}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextBox;
