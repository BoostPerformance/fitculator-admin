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
      <h1 className="sm:text-1.5-700 lg:text-1.75-700 font-bold text-gray-900 dark:text-white ">
        {title}
      </h1>
      {subtitle && (
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          {subtitle}
        </h2>
      )}
    </div>
  );
};

export default Title;
