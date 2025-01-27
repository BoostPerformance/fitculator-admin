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
  total: string;
  borderColor: string;
  grids?: string;
  textColor: string;
}) => {
  return (
    <div
      className={`mt-[1rem] flex flex-col h-[7rem] lg:w-[17.8rem] bg-white justify-center border-b-[0.2rem] ${borderColor} px-[1.3rem] rounded-[0.2rem] drop-shadow-md ${grids} sm:items-center`}
    >
      <div className="text-left text-1-600 text-gray-1">{title}</div>
      <div className={`text-right ${textColor}`}>
        <span className="text-1.5-700">{counts}</span>
        <span className=" text-1-700">/{total}</span>
      </div>
    </div>
  );
};

export default TotalFeedbackCounts;
