export default function Error() {
  return (
    <div className="lg:text-2-700 sm:text-1.5-700 flex flex-col items-center gap-[10rem] justify-center py-[10rem] dark:text-white">
      <h1>관리자에게 문의하세요</h1>
      <a
        href="/"
        className="lg:text-1.25-500 sm:text-1-500 border-black-1 border-[0.1rem] p-[0.8rem] rounded-lg hover:bg-gray-3"
      >
        뒤로가기
      </a>
    </div>
  );
}
