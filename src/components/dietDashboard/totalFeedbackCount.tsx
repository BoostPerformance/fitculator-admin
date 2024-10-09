const TotalFeedbackCounts = ({
  count,
  total,
}: {
  count: string;
  total: string;
}) => {
  return (
    <div className="mt-4">
      <span className="text-orange-500 text-4xl font-bold">{count}</span>
      <span className="text-gray-500">/{total}</span>
    </div>
  );
};

export default TotalFeedbackCounts;
