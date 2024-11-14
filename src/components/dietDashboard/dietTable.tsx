import { useState } from 'react';
import { CombinedData } from '@/types/dietTypes';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface DietTableProps {
  data: CombinedData[];
}

const sortData = (
  data: CombinedData[],
  sortBy: string,
  sortDirection: boolean
) => {
  return [...data].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name, 'ko') * (sortDirection ? 1 : -1);
    } else if (sortBy === 'id') {
      return (parseInt(a.id) - parseInt(b.id)) * (sortDirection ? 1 : -1);
    } else if (sortBy === 'updateTime') {
      return (
        a.updateTime.localeCompare(b.updateTime) * (sortDirection ? 1 : -1)
      );
    }
    return 0;
  });
};

const DietTable: React.FC<DietTableProps> = ({ data }) => {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<boolean>(true);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDirection(!sortDirection);
    } else {
      setSortBy(key);
      setSortDirection(true);
    }
  };

  const sortedData = sortData(data, sortBy, sortDirection);

  const renderSortArrow = (key: string) => {
    if (sortBy === key) {
      return sortDirection ? (
        <Image src="/svg/arrow-up.svg" alt="Ascending" width={12} height={10} />
      ) : (
        <Image
          src="/svg/arrow-down.svg"
          alt="Ascending"
          width={12}
          height={10}
        />
      );
    }
    return (
      <>
        <Image
          src="/svg/arrow-down.svg"
          alt="Descending"
          width={10}
          height={10}
        />
      </>
    );
  };

  const handleItemClick = (userId: string, date: string) => {
    router.push(`/user/diet/${userId}/${date}`);
  };

  // const calculateFeedback = (userId: string, mealDate: string) => {
  //   const totalMealsOnDate = data.filter(
  //     (meal) => meal.user_id === userId && meal.date === mealDate
  //   ).length;
  //   const feedbacksOnDate = data.filter(
  //     (feedback) => feedback.user_id === userId && feedback.date === mealDate
  //   ).length;

  //   return `${feedbacksOnDate} /${totalMealsOnDate}`;
  // };

  // if (loadingData) {
  //   return <div>Loading...</div>;
  // }

  return (
    <div className="mt-[1.4rem]">
      <table className="table-auto w-full bg-white shadow-md rounded-md">
        <thead>
          <tr className="bg-gray-100 text-left text-1-500 text-gray-6">
            <th className="p-[1rem]" onClick={() => handleSort('id')}>
              <div className="relative flex items-center justify-between pr-[1rem]">
                <div>ID</div>
                <div>{renderSortArrow('id')}</div>
                <span className="absolute right-[0rem] h-[100%] w-[1px] bg-gray-300"></span>
              </div>
            </th>
            <th
              className="p-[1rem] w-[6rem]"
              onClick={() => handleSort('name')}
            >
              <div className="relative flex justify-between items-center pr-[1rem]">
                <div>이름</div>
                <div>{renderSortArrow('name')}</div>
                <span className="absolute right-[0rem] h-[100%] w-[1px] bg-gray-300"></span>
              </div>
            </th>
            <th className="p-[1rem]">
              <div className="relative p-[1rem] flex justify-between items-center">
                <div>아침</div>
                <span className="absolute right-0 h-[50%] w-[1px] bg-gray-300"></span>
              </div>
            </th>
            <th className="p-[1rem]">
              <div className="relative p-[1rem] flex justify-between items-center">
                <div>점심</div>
                <span className="absolute right-0 h-[50%] w-[1px] bg-gray-300"></span>
              </div>
            </th>
            <th className="p-[1rem]">
              <div className="relative p-[1rem] flex justify-between items-center">
                <div>저녁</div>
                <span className="absolute right-0 h-[50%] w-[1px] bg-gray-300"></span>
              </div>
            </th>
            <th className="p-[1rem]">
              <div className="relative p-[1rem] flex justify-between items-center">
                <div>간식</div>
                <span className="absolute right-0 h-[50%] w-[1px] bg-gray-300"></span>
              </div>
            </th>

            <th
              className="p-[1rem] w-[9rem]"
              onClick={() => handleSort('updateTime')}
            >
              <div className="relative flex justify-between items-center">
                <div>업데이트</div>
                <div>{renderSortArrow('updateTime')}</div>
                <span className="absolute left-[7.9rem] h-[100%] w-[1px] bg-gray-300" />
              </div>
            </th>
            <th className="p-[1rem]">피드백 현황</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item) => (
            <tr key={item.user_id} className="border-b">
              <td className="p-[1rem]">{item.user_id}</td>
              <td className="p-[1rem]">{item.name ?? 'unknown'}</td>
              <td className="p-[1rem]">{item.breakfast || '없음'}</td>
              <td className="p-[1rem]">{item.lunch || '없음'}</td>
              <td className="p-[1rem]">{item.dinner || '없음'}</td>
              <td className="p-[1rem]">{item.snack || '없음'}</td>
              <td className="p-[1rem]">{item.updateTime}</td>
              <td>
                <button
                  className={`px-[0.625rem] py-[0.5rem] rounded-[0.5rem] w-[5.9375rem] h-[1.8125rem] flex items-center justify-center text-0.875-400 ${
                    item.user_id === item.date ? 'bg-green-500' : 'bg-[#FF9257]'
                  }`}
                  onClick={() => handleItemClick(item.user_id, item.date)}
                >
                  {/* {calculateFeedback(item.user_id, item.date)} */}calc
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DietTable;
