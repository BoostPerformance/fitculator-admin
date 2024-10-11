const MealPhotoLayout = ({ title, photos, descriptions, time }: any) => {
  const renderPhotos = () => {
    if (photos.length === 1) {
      return (
        <div className="w-full h-[10rem] overflow-hidden rounded-lg">
          <img
            src={`/image${photos}`}
            alt="meal"
            className="w-full h-full object-cover"
          />
        </div>
      );
    } else if (photos.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-[0.5rem]">
          {photos.map((photo: string, index: number) => (
            <div
              key={index}
              className="w-full h-[10rem] overflow-hidden rounded-lg"
            >
              <img
                src={`/image${photo}`}
                alt={`meal-${index}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      );
    } else if (photos.length === 3) {
      return (
        <div className="grid grid-cols-3 grid-rows-2 gap-[0.2rem]">
          <div className="col-span-2 row-span-2 h-full overflow-hidden rounded-lg">
            <img
              src={`/image${photos[0]}`}
              alt="meal-large"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="h-[5rem] overflow-hidden rounded-lg">
            <img
              src={`/image${photos[1]}`}
              alt="meal-small-1"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="h-[5rem] overflow-hidden rounded-lg">
            <img
              src={`/image${photos[2]}`}
              alt="meal-small-2"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      );
    } else if (photos.length === 4) {
      return (
        <div className="grid grid-cols-2 gap-[0.2rem]">
          {photos.map((photo: string, index: number) => (
            <div
              key={index}
              className="w-full h-[5rem] overflow-hidden rounded-lg"
            >
              <img
                src={`/image${photo}`}
                alt={`meal-${index}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div className="meal w-full">
      <h3 className="text-center mb-4 text-[1rem] font-semibold">{title}</h3>
      {renderPhotos()}
      <div className="text-[0.875rem] mt-2 text-gray-600">{time}</div>
      <div className="text-[0.875rem] mt-1">{descriptions}</div>
    </div>
  );
};

export default MealPhotoLayout;
