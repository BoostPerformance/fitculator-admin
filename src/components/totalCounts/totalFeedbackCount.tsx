const TotalFeedbackCounts = ({
  title,
  counts,
  total,
  borderColor,
  grids,
  textColor,
}: {
  title: string;
  counts: string;
  total?: string;
  borderColor: string;
  grids?: string;
  textColor?: string;
}) => {
  return (
    <div
      className={`mt-[1rem] flex flex-col py-[1.25rem] lg:w-[17.8rem] bg-white justify-center border-b-[0.4rem] ${borderColor} px-[1.3rem] rounded-[0.2rem] drop-shadow-md ${grids} sm:items-center `}
    >
      <div className="text-left text-1.25-700 text-[#6F6F6F]">{title}</div>
      <div className={`text-right ${textColor}`}>
        <span className=" text-1-700">
          <span className="text-2.5-900">{`${counts}`}</span>
        </span>
        {total ? (
          <>
            <span className="text-1.75-900">/</span>
            <span className="text-1.75-900">{`${total}`}</span>
          </>
        ) : (
          ''
        )}
      </div>
    </div>
  );
};

export default TotalFeedbackCounts;
