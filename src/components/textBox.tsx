// TextBox.tsx
import Image from 'next/image';
import React, { useRef, useState, useEffect } from 'react';

interface TextBoxProps {
  title: string;
  value?: string;
  placeholder?: string;
  button1?: string;
  button2?: string;
  svg1?: string;
  svg2?: string;
  onClick1?: () => void;
  onClick2?: () => void;
  onSave?: (feedback: string) => Promise<void>;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  Btn1className?: string;
  Btn2className?: string;
  readOnly?: boolean;
  copyIcon?: boolean;
  isFeedbackMode?: boolean;
  className?: string;
  disabled?: boolean;
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
  className,
  disabled = false,
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
// console.error('복사 실패:', err);
      }
    }
  };

  return (
    <div className={`relative lg:px-0 lg:w-full sm:min-w-[18rem] sm:dark:text-white sm:px-0 ${className || 'mt-[2rem] p-[1rem] lg:h-[28rem]'} ${className === 'h-full' ? 'h-full flex flex-col min-h-0' : ''}`}>
      {title && (
        <h4 className="text-1.375-700 font-semibold mb-2 flex items-center ">
          {title}
          {copyIcon && (
            <button className="ml-2 text-[1rem]" onClick={handleCopy}>
              <Image
                src="/svg/copyIcon-gray.svg"
                alt="copy icon"
                width={17}
                height={17}
                className="w-4 h-4"
              />
            </button>
          )}
        </h4>
      )}

      {copyMessage && copyIcon && (
        <div
          className="absolute top-[0.5rem] left-[10rem] bg-green-100 text-green-800 text-1-500 p-[0.5rem] rounded-[0.5rem] 
          transform transition-opacity duration-500 ease-in-out opacity-100"
        >
          텍스트가 복사되었습니다.
        </div>
      )}

      <div className={`flex flex-col items-end ${className === 'h-full' ? 'flex-1 min-h-0' : ''}`}>
        <textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={isFeedbackMode ? localValue : value}
          className={`border p-2 w-full rounded-md text-0.875-400 dark:bg-white dark:text-black ${
            readOnly ? 'bg-gray-100 cursor-not-allowed' : ''
          } ${className === 'h-full' ? 'flex-1 resize-none min-h-[400px] lg:min-h-[300px]' : 'h-[25rem] lg:h-[15rem]'}`}
          readOnly={readOnly}
          onChange={handleChange}
        />

        <div className="flex gap-[0.625rem] mt-[0.75rem] sm:w-full">
          <button
            className={`${disabled ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : Btn1className} flex flex-row gap-1 justify-center items-center rounded-md text-0.875-400 w-[9.3125rem] p-[0.375rem] sm:w-full`}
            onClick={handleButtonClick}
            disabled={disabled}
          >
            {svg1 && (
              <Image
                src={svg1}
                alt="icon"
                width={16}
                height={16}
                className="w-4 h-4"
              />
            )}
            {button1}
          </button>

          {button2 && (
            <button
              className={`${Btn2className} flex flex-row gap-1 justify-center items-center rounded-md text-0.875-400 w-[149px] p-[0.375rem] sm:w-full`}
              onClick={onClick2}
            >
              {svg2 && (
                <Image
                  src={svg2}
                  alt="icon"
                  width={17}
                  height={17}
                  className="w-4 h-4"
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
