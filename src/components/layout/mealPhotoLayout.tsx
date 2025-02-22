interface PhotoData {
  id: string;
  meal_id: string;
  photo_url: string;
  created_at: string;
}

interface MealPhotoLayoutProps {
  title: string;
  src: PhotoData[];
  descriptions: string;
  time: string;
  onAddComment?: () => void;
}

const MealPhotoLayout = ({
  title = "식단",
  src = [],
  descriptions = "",
  time = "",
}: MealPhotoLayoutProps) => {
  const filteredPhotos = src?.filter(Boolean) || [];

  // const timeToIOS = new Date(time).toISOString().split('T')[0];
  // console.log(timeToIOS);
  const renderPlaceholder = () => (
    <div className="w-full h-32 overflow-hidden rounded-lg flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300">
      <div className="text-gray-400 text-sm">식단이미지 없음</div>
    </div>
  );

  const renderPhotos = () => {
    if (!filteredPhotos.length) {
      return renderPlaceholder();
    }

    if (filteredPhotos.length === 1) {
      return (
        <div className="w-full h-32 overflow-hidden rounded-lg">
          <img
            src={filteredPhotos[0].photo_url}
            alt="meal image"
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    if (filteredPhotos.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-2 h-32">
          {filteredPhotos.map((photo, index) => (
            <div key={index} className="overflow-hidden rounded-lg">
              <img
                src={photo.photo_url}
                alt={`meal-${index}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      );
    }

    if (filteredPhotos.length === 3) {
      return (
        <div className="grid grid-cols-2 gap-2 h-32">
          <div className="row-span-2 overflow-hidden rounded-lg">
            <img
              src={filteredPhotos[0].photo_url}
              alt="meal-large"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="overflow-hidden rounded-lg">
            <img
              src={filteredPhotos[1].photo_url}
              alt="meal-small-1"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="overflow-hidden rounded-lg">
            <img
              src={filteredPhotos[2].photo_url}
              alt="meal-small-2"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      );
    }

    // 4장 이상의 사진
    return (
      <div className="grid grid-cols-2 gap-2 h-32">
        {filteredPhotos.slice(0, 4).map((photo, index) => (
          <div key={index} className="overflow-hidden rounded-lg">
            <img
              src={photo.photo_url}
              alt={`meal-${index}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col justify-between h-full">
      <div>
        <h3 className="text-center mb-2 text-base font-semibold">{title}</h3>
        {renderPhotos()}
        <div className="mt-2 text-sm text-gray-600">{time}</div>
        <div className="text-sm mt-1 whitespace-pre-wrap">{descriptions}</div>
      </div>
      {/* <div className="flex justify-center mt-4">
        <button
          className="text-gray-500 hover:text-gray-700"
          onClick={onAddComment}
        >
          <FaPlus size={20} />
        </button>
      </div> */}
    </div>
  );
};

export default MealPhotoLayout;
