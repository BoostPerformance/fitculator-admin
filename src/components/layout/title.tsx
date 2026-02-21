const Title = ({
 title,
 subtitle,
 className,
}: {
 title: string;
 subtitle?: string;
 className?: string;
}) => {
 return (
 <div className={`flex flex-col gap-2 ${className || ''}`}>
 <h1 className="sm:text-headline-lg font-bold lg:text-display font-bold font-bold text-content-primary dark:text-white ">
 {title}
 </h1>
 {subtitle && (
 <h2 className="text-lg font-semibold text-content-secondary">
 {subtitle}
 </h2>
 )}
 </div>
 );
};

export default Title;
