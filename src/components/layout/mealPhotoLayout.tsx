import { FaPlus } from 'react-icons/fa6';
import Image from 'next/image';

interface PhotoData {
  id: string;
  meal_id: string;
  photo_url: string;
  created_at: string;
}

interface MealPhotoLayoutProps {
  title: string;
  src: PhotoData[];
  descriptions: string | boolean;
  time: string;
  onAddComment?: () => void;
}

const MealPhotoLayout = ({
  title,
  src,
  descriptions,
  time,
  onAddComment,
}: MealPhotoLayoutProps) => {
  const filteredPhotos = src.filter((photo) => {
    //console.log(photo);
    return photo;
  });

  // console.log(src);
  const renderPhotos = () => {
    if (filteredPhotos.length === 1) {
      return (
        <div className="w-full h-[8rem] overflow-hidden rounded-lg">
          <Image
            src={filteredPhotos[0].photo_url}
            alt="meal image"
            className="w-full h-full object-cover"
            width={100}
            height={100}
          />
        </div>
      );
    } else if (filteredPhotos.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-[0.5rem]">
          {filteredPhotos.map((photo, index) => (
            <div
              key={index}
              className="w-full h-[8rem] overflow-hidden rounded-lg"
            >
              <Image
                src={photo.photo_url}
                alt={`meal-${index}`}
                className="w-full h-full object-cover"
                width={100}
                height={100}
              />
            </div>
          ))}
        </div>
      );
    } else if (filteredPhotos.length === 3) {
      return (
        <div className="grid grid-cols-3 grid-rows-2 gap-[0.2rem]">
          {filteredPhotos.map((photo, index) => (
            <>
              <div
                className="col-span-2 row-span-2 h-[8rem] overflow-hidden rounded-lg"
                key={index}
              >
                <Image
                  src={filteredPhotos[0].photo_url}
                  alt="meal-large"
                  className="w-full h-full object-cover"
                  width={100}
                  height={100}
                />
              </div>
              <div className="h-[4rem] overflow-hidden rounded-lg">
                <Image
                  src={filteredPhotos[1].photo_url}
                  alt="meal-small-1"
                  className="w-full h-full object-cover"
                  width={100}
                  height={100}
                />
              </div>
              <div className="h-[4rem] overflow-hidden rounded-lg">
                <Image
                  src={filteredPhotos[2].photo_url}
                  alt="meal-small-2"
                  className="w-full h-full object-cover"
                  width={100}
                  height={100}
                />
              </div>
            </>
          ))}
        </div>
      );
    } else if (filteredPhotos.length === 4) {
      return (
        <div className="grid grid-cols-2 gap-[0.5rem]">
          {filteredPhotos.map((photo, index) => (
            <div
              key={index}
              className="w-full h-[3.8rem] overflow-hidden rounded-lg"
            >
              <Image
                src={photo.photo_url}
                alt={`meal-${index}`}
                className="w-full h-full object-cover"
                width={100}
                height={100}
              />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="w-full h-[8rem] overflow-hidden rounded-lg flex items-center  justify-center border-gray-9 border-[0.5rem] text-gray-2">
        식단이미지 없음
      </div>
    );
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
