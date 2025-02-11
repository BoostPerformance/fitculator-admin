const TotalFeedbackCounts = ({
  title,
  counts,
  total,
  borderColor,
  grids,
  textColor,
}: {
  title: React.ReactNode | string; // 또는
  counts: string;
  total?: string;
  borderColor: string;
  grids?: string;
  textColor?: string;
}) => {
  return (
    <div
      className={`mt-[1rem] flex flex-col py-[1.25rem] lg:w-[17.8rem] bg-white justify-center border-b-[0.4rem] ${borderColor} px-[1.3rem] rounded-[0.2rem] drop-shadow-md ${grids} sm:items-center sm:gap-[0.6rem] md:items-center md:w-[9.5rem] md:p-0 md:py-[1rem] `}
    >
      <div className="text-left text-1.25-700 text-[#6F6F6F] sm:text-center sm:text-1-700 md:text-1-700">
        {title}
      </div>
      <div className={`text-right ${textColor}`}>
        <span className=" text-1-700 sm:text-0.625-500">
          <span className="text-2.5-900 sm:text-2-900 md:text-1.5-900">{`${counts}`}</span>
        </span>
        {total ? (
          <>
            <span className="text-1.75-900">/</span>
            <span className="text-1.75-900 md:text-1-900">{`${total}`}</span>
          </>
        ) : (
          ''
        )}
      </div>
    </div>
  );
};

export default TotalFeedbackCounts;
