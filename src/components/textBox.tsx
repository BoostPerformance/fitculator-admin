// TextBox.tsx
import Image from 'next/image';
import React, { useRef, useState, useEffect } from 'react';

interface TextBoxProps {
  title: string;
  value?: string;
  placeholder?: string;
  button1?: string;
  button2?: string;
  svg1: string;
  svg2?: string;
  onClick1?: () => void;
  onClick2?: () => void;
  onSave?: (feedback: string) => Promise<void>; // date 파라미터 제거
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  Btn1className?: string;
  Btn2className?: string;
  readOnly?: boolean;
  copyIcon?: boolean;
  isFeedbackMode?: boolean;
}

const TextBox = ({
  title,
  placeholder,
  value = '',
  button1,
  button2,
  svg1,
  svg2,
  onClick1,
  onClick2,
  onChange,
  Btn1className,
  Btn2className,
  readOnly = false,
  copyIcon,
  onSave,
  isFeedbackMode,
}: TextBoxProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copyMessage, setCopyMessage] = useState<boolean>(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange?.(e);
  };

  const handleButtonClick = async () => {
    if (isFeedbackMode && onSave) {
      await onSave(localValue);
    } else {
      onClick1?.();
    }
  };

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

  return (
    <div className="mt-[2rem] p-[1rem] relative lg:w-full lg:h-[30rem] sm:min-w-[23rem]">
      <h4 className="text-1.375-700 font-semibold mb-2 flex items-center">
        {title}
        <button className="ml-2 text-[1rem]" onClick={handleCopy}>
          <Image
            src="/svg/copyIcon-gray.svg"
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
          value={isFeedbackMode ? localValue : value}
          className={`border p-2 w-full rounded-md text-0.875-400 h-[20rem] ${
            readOnly ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
          readOnly={readOnly}
          onChange={handleChange}
        />

        {/* <div className="flex gap-[1rem] w-[19.625rem] sm:w-[17rem]"> */}
        <div className="flex gap-[0.625rem] mt-[0.75rem] sm:w-full">
          <button
            className={`${Btn1className} flex flex-row gap-1 justify-center items-center rounded-md text-0.875-400 w-[9.3125rem] p-[0.375rem] sm:w-full`}
            onClick={handleButtonClick}
          >
            <Image
              src={svg1}
              alt="icon"
              width={16}
              height={16}
              className="w-4 h-4"
            />
            {button1}
          </button>

          {button2 && (
            <button
              className={`${Btn2className} flex flex-row gap-1 justify-center items-center rounded-md text-0.875-400 w-[149px] sm:w-full`}
              onClick={onClick2}
            >
              {svg2 && (
                <Image
                  src={svg2}
                  alt="icon"
                  width={17}
                  height={17}
                  className="w-4 h-4"
                  onClick={onClick2}
                />
              )}
              {button2}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextBox;
