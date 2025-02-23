// TextBox.tsx
import Image from "next/image";
import React, { useRef, useState, useEffect } from "react";

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
  value = "",
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
        console.error("복사 실패:", err);
      }
    }
  };

  return (
    <div className="mt-[2rem] p-[1rem] border rounded-md relative lg:w-full lg:h-[30rem] sm:min-w-[23rem]">
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
          ${copyMessage ? "opacity-100" : "opacity-0"}`}
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
            readOnly ? "bg-gray-100 cursor-not-allowed" : ""
          }`}
          readOnly={readOnly}
          onChange={handleChange}
        />
        <div className="flex gap-[1rem] w-[19.625rem] sm:w-full">
          <div className="flex relative sm:justify-center sm:gap-[1.4rem] w-full">
            <button
              className={`${Btn1className} rounded-md text-0.875-400 mt-[0.5rem] ${
                button2 ? "lg:w-[9.3125rem]" : "w-full"
              } sm:w-full md:w-full h-[2.5rem]`}
              onClick={handleButtonClick}
            >
              {button1}
            </button>
            {button1 && svg1 && (
              <Image
                src={svg1}
                alt="icon"
                width={17}
                height={17}
                className={`absolute top-[1.2rem] ${
                  button2
                    ? "lg:right-[5.3rem] lg:top-[1.2rem] sm:left-[2rem]"
                    : "lg:right-[11.5rem] lg:top-[1.3rem] sm:left-[6rem] sm:top-[1.3rem]"
                } w-4 h-4`}
                onClick={handleButtonClick}
              />
            )}
          </div>
          {button2 && (
            <div className="flex relative justify-center w-1/2">
              <button
                className={`${Btn2className} rounded-md text-0.875-400 mt-[0.5rem] w-[9.3125rem] h-[2.5rem]`}
                onClick={onClick2}
              >
                {button2}
              </button>
              {svg2 && (
                <Image
                  src={svg2}
                  alt="icon"
                  width={17}
                  height={17}
                  className="absolute top-[1.2rem] left-[2.4rem] w-4 h-4"
                  onClick={onClick2}
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
