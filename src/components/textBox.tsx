import Image from 'next/image';
import React, { useRef, useState } from 'react';

interface TextBoxProps {
  title: string;
  value?: string;
  placeholder?: string;
  content?: string;
  button1?: string;
  button2?: string;
  svg1: string;
  svg2?: string;
  onClick1?: () => void;
  onClick2?: () => void;
  onModalClick?: () => void;
  onModalClose?: () => void;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  Btn1className?: string;
  Btn2className?: string;
  readOnly?: boolean;
  isModal?: boolean;
  copyIcon?: boolean;
}

const TextBox = ({
  title,
  placeholder,
  value,
  button1,
  button2,
  svg1,
  svg2,
  onClick1,
  onClick2,
  onModalClick,
  onModalClose,
  onChange,
  Btn1className,
  Btn2className,
  readOnly = false,
  isModal = false,
  copyIcon,
}: TextBoxProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copyMessage, setCopyMessage] = useState<boolean>(false);

  const handleCopy = async () => {
    if (textareaRef.current) {
      try {
        await navigator.clipboard.writeText(textareaRef.current.value);
        setCopyMessage(true);
        setTimeout(() => {
          setCopyMessage(false);
        }, 5000);
      } catch (err) {
        console.error('복사 실패:', err);
      }
    }
  };

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white rounded-lg p-6 w-[90%] max-w-[500px] relative">
          <h4 className="text-xl font-semibold mb-4">{title} 코멘트 달기</h4>
          <textarea
            placeholder={placeholder}
            className={`border p-2 w-full rounded-md text-base h-[8rem]`}
          />
          <div className="flex justify-end gap-2 mt-4">
            <button
              className="bg-[#FF9257] text-white rounded-md py-2 px-4"
              onClick={onModalClick}
            >
              {button1}
            </button>
            {button2 && (
              <button
                className={`bg-gray-500 text-white rounded-md py-2 px-4`}
                onClick={onModalClose}
              >
                {button2}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-[2rem] p-[1rem] border rounded-md relative lg:w-[48rem] lg:h-[30rem]">
      <h4 className="text-1.375-700 font-semibold mb-2 flex items-center">
        {title}
        <button className="ml-2 text-[1rem]" onClick={handleCopy}>
          <Image
            src="/svg/copyIcon.svg"
            alt="copy icon"
            width={17}
            height={17}
            className="w-4 h-4"
          />
        </button>
      </h4>
      {copyIcon && (
        <div
          className={`absolute top-[0.5rem] left-[10rem] bg-green-100 text-green-800 text-1-500 p-[0.5rem] rounded-[0.5rem] 
        transform transition-opacity duration-500 ease-in-out
        ${copyMessage ? 'opacity-100' : 'opacity-0'}`}
        >
          텍스트가 복사되었습니다.
        </div>
      )}

      <div className="flex flex-col items-end">
        <textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={value}
          className={`border p-2 w-full rounded-md text-0.875-400 h-[20rem] ${
            readOnly ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
          readOnly={readOnly}
          onChange={onChange}
        />
        <div className="flex gap-[1rem] w-[19.625rem]">
          <div className="flex relative sm:justify-center w-full justify-end">
            <button
              className={`${Btn1className} rounded-md  text-0.875-400 mt-[0.5rem] lg:w-[9.3125rem] sm:w-full h-[2.5rem]`}
              onClick={onClick1}
            >
              {button1}
            </button>
            <Image
              src={svg1}
              alt="copy icon"
              width={17}
              height={17}
              className="absolute top-[1.2rem] right-[6rem] sm:left-[2.4rem] w-4 h-4"
            />
          </div>
          {button2 && (
            <div className="flex relative justify-center w-full">
              <button
                className={`${Btn2className} rounded-md  text-0.875-400 mt-[0.5rem] w-[9.3125rem] h-[2.5rem]`}
                onClick={onClick2}
              >
                {button2}
              </button>
              {svg2 && (
                <Image
                  src={svg2}
                  alt="copy icon"
                  width={17}
                  height={17}
                  className="absolute top-[1.2rem] left-[2.4rem] w-4 h-4"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextBox;
