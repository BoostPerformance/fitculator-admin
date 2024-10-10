const Meal = ({ title, photos, time, descriptions }: any) => {
  return (
    <div className="mt-[1rem]">
      <h3 className="text-[1.25rem] font-semibold mb-4">{title}</h3>
      <div className="grid ">
        {photos.map((photo: string, index: number) => (
          <div key={index} className="text-center">
            <img
              src={`/image/${photo}`}
              alt={`meal-${index}`}
              className="w-full h-[12rem] object-cover rounded-md"
            />
            <div className="mt-2 text-[0.875rem]">{descriptions[index]}</div>
            <div className="text-[0.875rem] text-gray-500">{time[index]}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Meal;
