import { FaPlus } from 'react-icons/fa6';

interface MealPhotoLayoutProps {
  title: string;
  photos: (string | null | undefined)[];
  descriptions: string | boolean;
  time: string;
  onAddComment?: () => void;
}

const MealPhotoLayout = ({
  title,
  photos,
  descriptions,
  time,
  onAddComment,
}: MealPhotoLayoutProps) => {
  const filteredPhotos = photos.filter((photo): photo is string =>
    Boolean(photo)
  );

  const renderPhotos = () => {
    if (filteredPhotos.length === 1) {
      return (
        <div className="w-full h-[8rem] overflow-hidden rounded-lg">
          <img
            src={`/image${filteredPhotos[0]}`}
            alt="meal"
            className="w-full h-full object-cover"
          />
        </div>
      );
    } else if (filteredPhotos.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-[0.5rem]">
          {filteredPhotos.map((photo: string, index: number) => (
            <div
              key={index}
              className="w-full h-[8rem] overflow-hidden rounded-lg"
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
    } else if (filteredPhotos.length === 3) {
      return (
        <div className="grid grid-cols-3 grid-rows-2 gap-[0.2rem]">
          <div className="col-span-2 row-span-2 h-[8rem] overflow-hidden rounded-lg">
            <img
              src={`/image${filteredPhotos[0]}`}
              alt="meal-large"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="h-[4rem] overflow-hidden rounded-lg">
            <img
              src={`/image${filteredPhotos[1]}`}
              alt="meal-small-1"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="h-[4rem] overflow-hidden rounded-lg">
            <img
              src={`/image${filteredPhotos[2]}`}
              alt="meal-small-2"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      );
    } else if (filteredPhotos.length === 4) {
      return (
        <div className="grid grid-cols-2 gap-[0.5rem]">
          {filteredPhotos.map((photo: string, index: number) => (
            <div
              key={index}
              className="w-full h-[3.8rem] overflow-hidden rounded-lg"
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
    <div className="w-full flex flex-col justify-between h-full">
      <div>
        <h3 className="text-center mb-2 text-base font-semibold">{title}</h3>
        {renderPhotos()}
        <div className="mt-2 text-sm text-gray-600">{time}</div>
        <div className="text-sm mt-1">{descriptions}</div>
      </div>
      <div className="flex justify-center mt-4">
        <button
          className="text-gray-500 hover:text-gray-700"
          onClick={onAddComment}
        >
          <FaPlus size={20} />
        </button>
      </div>
    </div>
  );
};

export default MealPhotoLayout;
