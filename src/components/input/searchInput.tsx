import { CiSearch } from 'react-icons/ci';
const SearchIput = ({ placeholder = 'Search' }) => {
  const handleSearch = () => {
    //console.log('diet search clicked');
  };
  return (
    <div className="relative ">
      <input
        type="text"
        placeholder={placeholder}
        className="sm:w-[10rem] sm:h-[2.3rem] pr-[1rem] border pl-[2.5rem]  py-[0.5rem] border-gray-300 p-2 rounded-md w-[15rem] focus:ring-blue-500 focus:ring-2 dark:bg-gray-3 dark:placeholder:text-gray-5 dark:text-black"
      />
      <button
        className="absolute left-[0.75rem] top-[0.5rem] text-gray-400"
        onClick={handleSearch}
      >
        <CiSearch size={20} className="dark:invert" />
      </button>
    </div>
  );
};

export default SearchIput;
