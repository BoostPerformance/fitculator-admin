import Image from 'next/image';
import React, { useRef, useState } from 'react';

interface TextBoxProps {
  title: string;
  inputbox: string;
  content?: string;
  button1: string;
  button2?: string;
  onClick1?: () => void;
  onClick2?: () => void;
  onModalClick?: () => void;
  onModalClose?: () => void;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  readOnly?: boolean;
  isModal?: boolean;
}

const TextBox = ({
  title,
  inputbox,
  button1,
  button2,
  onClick1,
  onClick2,
  onModalClick,
  onModalClose,
  onChange,
  className,
  readOnly = false,
  isModal = false,
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
            placeholder={inputbox}
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
                className="bg-gray-500 text-white rounded-md py-2 px-4"
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
          />
        </button>
      </h4>
      <div
        className={`absolute top-[0.5rem] left-[10rem] bg-green-100 text-green-800 text-1-500 p-[0.5rem] rounded-[0.5rem] 
        transform transition-opacity duration-500 ease-in-out
        ${copyMessage ? 'opacity-100' : 'opacity-0'}`}
      >
        텍스트가 복사되었습니다.
      </div>

      <div className="flex flex-col items-end">
        <textarea
          ref={textareaRef}
          placeholder={inputbox}
          className={`border p-2 w-full rounded-md text-0.875-400 h-[20rem] ${
            readOnly ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
          readOnly={readOnly}
          onChange={onChange}
        />
        <div className="flex gap-[1rem]">
          <button
            className={`${className} bg-[#FF9257] text-white rounded-md  text-0.875-400 mt-[0.5rem] w-[5.5rem] h-[2rem]`}
            onClick={onClick1}
          >
            {button1}
          </button>
          {button2 && (
            <button
              className="bg-[#48BA5D] text-white rounded-md h-[2rem] w-[5.5rem] text-0.875-400 mt-[0.5rem]"
              onClick={onClick2}
            >
              {button2}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextBox;
