import { useState } from 'react';
import Image from 'next/image';
interface PhotoData {
  id: string;
  meal_id: string;
  photo_url: string;
  created_at: string;
}

export interface MealItem {
  description: string;
  meal_photos: PhotoData[];
  updatedAt: string;
  meal_time: string;
}

interface MealPhotoLayoutProps {
  title: string;
  mealItems: MealItem[];
  onAddComment?: () => void;
}

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

const ImageModal = ({ imageUrl, onClose }: ImageModalProps) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div className="relative max-w-[90%] max-h-[90%]">
        <button
          className="absolute -left-10 top-0 text-white text-2xl font-bold hover:text-gray-300"
          onClick={onClose}
        >
          ✕
        </button>
        <Image
          src={imageUrl}
          alt="확대된 이미지"
          className="max-w-full max-h-[80vh] object-contain"
          onClick={(e) => e.stopPropagation()}
          width={900}
          height={900}
        />
      </div>
    </div>
  );
};

const MealPhotoLayout = ({
  title = '식단',
  mealItems = [],
  onAddComment,
}: MealPhotoLayoutProps) => {
  // mealItems를 시간순으로 정렬 (이른 시간 -> 늦은 시간)
  const sortedMealItems = [...mealItems].sort((a, b) => {
    // meal_time을 기준으로 정렬
    const timeA = new Date(a.meal_time).getTime();
    const timeB = new Date(b.meal_time).getTime();
    return timeA - timeB; // 오름차순 정렬 (이른 시간 -> 늦은 시간)
    // 내림차순 정렬(최신순)을 원한다면 return timeB - timeA; 로 변경
  });
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const currentItem = sortedMealItems[currentItemIndex] || {
    description: '',
    meal_photos: [],
    updatedAt: '',
    meal_time: '',
  };

  // 현재 항목의 사진 목록을 필터링합니다
  const filteredPhotos = currentItem.meal_photos?.filter(Boolean) || [];

  const goToPrevItem = () => {
    if (mealItems.length <= 1) return;
    const isFirstItem = currentItemIndex === 0;
    const newIndex = isFirstItem ? mealItems.length - 1 : currentItemIndex - 1;

    setCurrentItemIndex(newIndex);
  };

  // 다음 항목으로 이동
  const goToNextItem = () => {
    if (mealItems.length <= 1) return;
    const isLastItem = currentItemIndex === mealItems.length - 1;
    const newIndex = isLastItem ? 0 : currentItemIndex + 1;
    setCurrentItemIndex(newIndex);
  };

  const formatMealTime = (timeString?: string) => {
    if (!timeString) return '';

    try {
      const utcDate = new Date(timeString);
      const date = new Date(utcDate.getTime());

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      return `식사 시간: ${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (e) {
      return timeString;
    }
  };

  // const timeToIOS = new Date(time).toISOString().split('T')[0];
  // console.log(timeToIOS);
  const renderPlaceholder = () => (
    <div className="w-full h-32 overflow-hidden rounded-lg flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300">
      <div className="text-gray-400 text-sm">식단이미지 없음</div>
    </div>
  );

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const renderPhotos = () => {
    if (!filteredPhotos.length) {
      return renderPlaceholder();
    }

    if (filteredPhotos.length === 1) {
      return (
        <div
          className="w-full h-32 overflow-hidden rounded-lg cursor-pointer"
          onClick={() => handleImageClick(filteredPhotos[0].photo_url)}
        >
          <Image
            src={filteredPhotos[0].photo_url}
            alt="meal image"
            className="w-full h-full object-cover"
            width={100}
            height={100}
          />
        </div>
      );
    }

    if (filteredPhotos.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-2 h-32">
          {filteredPhotos.map((photo, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-lg cursor-pointer"
              onClick={() => handleImageClick(photo.photo_url)}
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

    if (filteredPhotos.length === 3) {
      return (
        <div className="grid grid-cols-2 gap-2 h-32">
          <div
            className="row-span-2 overflow-hidden rounded-lg cursor-pointer"
            onClick={() => handleImageClick(filteredPhotos[0].photo_url)}
          >
            <Image
              src={filteredPhotos[0].photo_url}
              alt="meal-large"
              className="w-full h-full object-cover"
              width={100}
              height={100}
            />
          </div>
          <div
            className="overflow-hidden rounded-lg cursor-pointer"
            onClick={() => handleImageClick(filteredPhotos[1].photo_url)}
          >
            <Image
              src={filteredPhotos[1].photo_url}
              alt="meal-small-1"
              className="w-full h-full object-cover"
              width={100}
              height={100}
            />
          </div>
          <div
            className="overflow-hidden rounded-lg cursor-pointer"
            onClick={() => handleImageClick(filteredPhotos[2].photo_url)}
          >
            <Image
              src={filteredPhotos[2].photo_url}
              alt="meal-small-2"
              className="w-full h-full object-cover"
              width={100}
              height={100}
            />
          </div>
        </div>
      );
    }

    // 4장 이상의 사진
    return (
      <div className="grid grid-cols-2 gap-2 h-32">
        {filteredPhotos.slice(0, 4).map((photo, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-lg cursor-pointer"
            onClick={() => handleImageClick(photo.photo_url)}
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
  };

  return (
    <div className="w-full flex flex-col justify-between h-full">
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
      <div>
        <h3 className="lg:mb-[2.125rem] sm:mb-[0.5rem] text-base font-semibold">
          {title}
        </h3>
        <div className="lg:px-[0.625rem]">
          {renderPhotos()}
          {currentItem.meal_time && (
            <div className="mt-2 text-sm text-gray-600 dark:text-white">
              {formatMealTime(currentItem.meal_time)}
            </div>
          )}
          <div className="text-sm mt-1 min-h-[5rem]">
            {currentItem.description || '내용이 없습니다.'}
          </div>
        </div>
      </div>

      {mealItems.length > 1 && (
        <div className="flex justify-between mt-4">
          <button
            onClick={goToPrevItem}
            disabled={currentItemIndex === 0}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              currentItemIndex === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'hover:bg-blue-50'
            }`}
          >
            ← 이전
          </button>
          <div>
            {currentItemIndex + 1} /{sortedMealItems.length}
          </div>
          <button
            onClick={goToNextItem}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              currentItemIndex === mealItems.length - 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'hover:bg-blue-50'
            }`}
          >
            다음 →
          </button>
        </div>
      )}
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
