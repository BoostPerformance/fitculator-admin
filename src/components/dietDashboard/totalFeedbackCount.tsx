const TotalFeedbackCounts = ({
  count,
  total,
}: {
  count: string;
  total: string;
}) => {
  return (
    <div className="mt-[1rem] flex flex-col h-[7rem] w-[20rem] bg-white justify-center border-b-[0.2rem] border-orange-500 px-[1.3rem] rounded-[0.2rem] drop-shadow-md">
      <div className="text-left text-1-600 text-gray-1">피드백 미작성</div>
      <div className="text-right">
        <span className="text-orange-500 text-1.5-700">{count}</span>
        <span className="text-orange-500 text-1-700">/{total}</span>
      </div>
    </div>
  );
};

export default TotalFeedbackCounts;
