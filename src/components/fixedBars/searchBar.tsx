import React from 'react';

interface SearchBarProps {
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ placeholder = 'Search' }) => {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        className="w-[30rem] pl-[2.5rem] pr-[1rem] py-[0.5rem] rounded-lg bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-[10rem]"
      />
      <div className="absolute left-[0.75rem] top-[0.5rem]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-[1.25rem] w-[1.25rem] text-gray-500"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M12.9 14.32a7 7 0 111.41-1.41l5.24 5.24a1 1 0 01-1.42 1.42l-5.24-5.24zm-6.9-7.32a5 5 0 100 10 5 5 0 000-10z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );
};

export default SearchBar;
