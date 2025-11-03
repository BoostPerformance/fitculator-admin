import { ReactNode, useState } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip = ({ children, content, position = 'right' }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-[10000] px-3 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg whitespace-nowrap pointer-events-none ${positionClasses[position]} animate-in fade-in-0 zoom-in-95 duration-200`}
          role="tooltip"
        >
          {content}
          {/* Arrow */}
          <div
            className={`absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45 ${
              position === 'right'
                ? 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2'
                : position === 'left'
                ? 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2'
                : position === 'top'
                ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2'
                : 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2'
            }`}
          />
        </div>
      )}
    </div>
  );
};
