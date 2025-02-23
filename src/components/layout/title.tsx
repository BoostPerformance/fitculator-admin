const Title = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="lg:text-1.75-700 font-bold text-gray-900 dark:text-white">
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
