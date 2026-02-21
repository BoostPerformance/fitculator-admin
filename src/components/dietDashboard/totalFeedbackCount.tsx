const TotalFeedbackCounts = ({
 counts,
 total,
}: {
 counts: string;
 total: string;
}) => {
 return (
 <div className="mt-[1rem] flex flex-col h-[7rem] w-[20rem] bg-surface justify-center border-b-[0.2rem] border-orange-500 px-[1.3rem] rounded-[0.2rem] drop-shadow-md">
 <div className="text-left text-title font-semibold text-content-secondary">피드백 미작성</div>
 <div className="text-right">
 <span className="text-orange-500 text-headline-lg font-bold">{counts}</span>
 <span className="text-orange-500 text-title font-bold">/{total}</span>
 </div>
 </div>
 );
};

export default TotalFeedbackCounts;
