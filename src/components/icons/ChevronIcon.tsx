import { memo } from 'react';

interface ChevronIconProps {
  isOpen: boolean;
  className?: string;
  size?: number;
}

export const ChevronIcon = memo(({ isOpen, className = '', size = 16 }: ChevronIconProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={`transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-180' : ''} ${className}`}
      aria-hidden="true"
    >
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

ChevronIcon.displayName = 'ChevronIcon';
