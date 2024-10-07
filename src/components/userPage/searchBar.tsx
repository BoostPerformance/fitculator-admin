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
        className="w-[50rem] pl-10 pr-4 py-2 rounded-lg bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="absolute left-3 top-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-500"
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
