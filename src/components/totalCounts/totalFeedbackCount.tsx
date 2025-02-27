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
    <div className={`w-full h-full overflow-hidden dark:bg-blue-4 ${grids}`}>
      <div
        className={`flex flex-col py-[1.25rem] lg:w-full min-h-[8.5rem] bg-white justify-center border-b-[0.4rem] ${borderColor} px-[1.3rem] rounded-[0.2rem] drop-shadow-md sm:items-center sm:gap-[0.6rem] md:items-center md:justify-between md:w-full md:max-h-[8rem] md:p-0 md:py-[1rem] w-full`}
      >
        <div className="text-left text-1.25-700 text-[#6F6F6F] sm:text-center sm:text-1-700 sm:whitespace-nowrap md:text-1-700 md:inline-block md:text-center">
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
            ""
          )}
        </div>
      </div>
    </div>
  );
};

export default TotalFeedbackCounts;
