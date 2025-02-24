const Title = ({ title }: { title: string }) => {
  return (
    <h1 className="lg:text-1.75-700 font-bold text-gray-900 dark:text-white">
      {title}
    </h1>
  );
};

export default Title;
