const TotalFeedbackCounts = ({
 title,
 counts,
 total,
 borderColor,
 grids,
 textColor,
 loading,
}: {
 title: React.ReactNode | string;
 counts: string;
 total?: string;
 borderColor: string;
 grids?: string;
 textColor?: string;
 loading?: boolean;
}) => {
 return (
 <div className={`w-full h-full overflow-hidden ${grids}`}>
 <div
 className={`flex flex-col py-[1.25rem] lg:w-full min-h-[8.5rem] bg-surface justify-center border-b-[0.4rem] ${borderColor} px-[1.3rem] rounded-lg border border-line sm:items-center sm:gap-[0.6rem] md:items-center md:justify-between md:w-full md:max-h-[8rem] md:p-0 md:py-[1rem] w-full`}
 >
 <div className="text-left text-title-lg font-bold text-content-tertiary sm:text-center sm:text-title font-bold sm:whitespace-nowrap md:text-title font-bold md:inline-block md:text-center">
 {title}
 </div>
 <div className={`text-right ${textColor}`}>
 {loading ? (
 <div className="flex justify-end sm:justify-center">
 <div className="w-8 h-8 border-4 border-t-4 border-line border-t-blue-500 rounded-full animate-spin"></div>
 </div>
 ) : (
 <>
 <span className=" text-title font-bold sm:text-label-xs font-medium">
 <span className="text-display-lg font-bold sm:text-display-lg font-bold md:text-headline-lg font-bold">{`${counts}`}</span>
 </span>
 {total ? (
 <>
 <span className="text-display font-bold">/</span>
 <span className="text-display font-bold md:text-title font-bold">{`${total}`}</span>
 </>
 ) : (
 ''
 )}
 </>
 )}
 </div>
 </div>
 </div>
 );
};

export default TotalFeedbackCounts;
