import Image from 'next/image';
import { useRef, useState } from 'react';

interface TextBoxProps {
  title: string;
  inputbox: string;
  content?: string;
  button1: string;
  button2?: string;
  onClickAIGenerate?: () => void;
  onClickCopyIcon?: () => void;
  onSendFeedback?: () => void;
  className?: string;
  readOnly?: boolean;
}

const TextBox = ({
  title,
  inputbox,
  button1,
  button2,
  onClickAIGenerate,
  onSendFeedback,
  onClickCopyIcon,
  className,
  readOnly = false,
}: TextBoxProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copyMessage, setCopyMessage] = useState<boolean>(false); // 복사 메시지 상태

  const handleCopy = () => {
    if (textareaRef.current) {
      textareaRef.current.select();
      document.execCommand('copy');
      setCopyMessage(true); // 메시지를 보여줌
      setTimeout(() => {
        setCopyMessage(false); // 5초 후 메시지를 숨김
      }, 5000);
    }
  };

  return (
    <div className="mt-[2rem] p-[1rem] border rounded-md relative">
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
          className={`border p-2 w-full rounded-md text-0.875-400 h-[8rem] ${
            readOnly ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
          readOnly={readOnly}
        />
        <div className="flex gap-[1rem]">
          <button
            className={`${className} bg-[#FF9257] text-white rounded-md  text-0.875-400 mt-[0.5rem] w-[5.5rem] h-[2rem]`}
            onClick={onClickAIGenerate}
            disabled={readOnly}
          >
            {button1}
          </button>
          {button2 && (
            <button
              className="bg-[#48BA5D] text-white rounded-md h-[2rem] w-[5.5rem] text-0.875-400 mt-[0.5rem]"
              onClick={onSendFeedback}
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
