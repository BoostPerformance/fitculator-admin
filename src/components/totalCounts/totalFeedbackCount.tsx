const TotalFeedbackCounts = ({
  title,
  counts,
  total,
  borderColor,
}: {
  title: string;
  counts: string;
  total: string;
  borderColor: string;
}) => {
  return (
    <div
      className={`mt-[1rem] flex flex-col h-[7rem] w-[17rem] bg-white justify-center border-b-[0.2rem] ${borderColor} px-[1.3rem] rounded-[0.2rem] drop-shadow-md`}
    >
      <div className="text-left text-1-600 text-gray-1">{title}</div>
      <div className="text-right">
        <span className="text-orange-500 text-1.5-700">{counts}</span>
        <span className="text-orange-500 text-1-700">/{total}</span>
      </div>
    </div>
  );
};

export default TotalFeedbackCounts;
