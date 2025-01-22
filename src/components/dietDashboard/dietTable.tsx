//import { useState } from 'react';
//import { CombinedData } from '@/types/dietTypes';
//import { useRouter } from 'next/navigation';
//import Image from 'next/image';
//import DietTableMockData from '../mock/DietTableMockData';
//import { ActivityStatus } from '@/types/dietTypes';

interface DietTableItem {
  display_name: string;
  name: string;
  meals: number[];
  coach_memo?: string;
  feedback_counts: number;
}

interface DietTableProps {
  data: DietTableItem[];
}

// const sortData = (
//   data: CombinedData[],
//   sortBy: string,
//   sortDirection: boolean
// ) => {
//   return [...data].sort((a, b) => {
//     if (sortBy === 'name') {
//       return a.name.localeCompare(b.name, 'ko') * (sortDirection ? 1 : -1);
//     }
//      else if (sortBy === 'id') {
//       return (parseInt(a.id) - parseInt(b.id)) * (sortDirection ? 1 : -1);
//     } else if (sortBy === 'updateTime') {
//       return (
//         a.updateTime.localeCompare(b.updateTime) * (sortDirection ? 1 : -1)
//       );
//     }
//     return 0;
//   });
// };

const DietTable: React.FC<DietTableProps> = ({ data }) => {
  //const router = useRouter();
  // const [sortBy, setSortBy] = useState<string>('id');
  // const [sortDirection, setSortDirection] = useState<boolean>(true);

  // const handleSort = (key: string) => {
  //   if (sortBy === key) {
  //     setSortDirection(!sortDirection);
  //   } else {
  //     setSortBy(key);
  //     setSortDirection(true);
  //   }
  // };

  //const sortedData = sortData(data, sortBy, sortDirection);

  // const renderSortArrow = (key: string) => {
  //   if (sortBy === key) {
  //     return sortDirection ? (
  //       <Image src="/svg/arrow-up.svg" alt="Ascending" width={12} height={10} />
  //     ) : (
  //       <Image
  //         src="/svg/arrow-down.svg"
  //         alt="Ascending"
  //         width={12}
  //         height={10}
  //       />
  //     );
  //   }
  //   return (
  //     <>
  //       <Image
  //         src="/svg/arrow-down.svg"
  //         alt="Descending"
  //         width={10}
  //         height={10}
  //       />
  //     </>
  //   );
  // };

  // const handleItemClick = (userId: string, date: string) => {
  //   router.push(`/user/diet/${userId}/${date}`);
  // };

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

  const renderMealsDots = (data: number[]) => {
    return (
      <div className="flex gap-1">
        {data.map((dot, index) => (
          <div key={index}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 21 20"
              fill="none"
            >
              <circle
                cx="10"
                cy="10"
                r="10"
                transform="matrix(-1 0 0 1 20.334 0)"
                fill={dot === 1 ? '#26CBFF' : '#D9D9D9'}
              />
            </svg>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mt-[1.4rem]">
      <table className="table-auto w-full bg-white shadow-md rounded-md ">
        <thead>
          <tr className="bg-gray-100 text-left text-1-500 text-gray-6">
            <th className="p-[1rem] ">
              <div className="relative flex items-center justify-between ">
                <div>닉네임</div>
                {/* <div>{renderSortArrow('id')}</div> */}
                <span className="absolute right-[0rem] h-[100%] w-[1px] bg-gray-300"></span>
              </div>
            </th>
            <th className="p-[1rem]">
              <div className="relative flex justify-between items-center pr-[1rem]">
                <div>이름</div>
                {/* <div>{renderSortArrow('name')}</div> */}
                <span className="absolute right-[0rem] h-[100%] w-[1px] bg-gray-300"></span>
              </div>
            </th>
            <th className="p-[1rem]">
              <div className="relative flex justify-between items-center pr-[1rem]">
                <div>식단</div>
                {/* <div>{renderSortArrow('name')}</div> */}
                <span className="absolute right-[0rem] h-[100%] w-[1px] bg-gray-300"></span>
              </div>
            </th>

            <th
              className="p-[1rem] w-[9rem]"
              // onClick={() => handleSort('updateTime')}
            >
              <div className="relative flex justify-between items-center">
                <div>운동</div>
                {/* <div>{renderSortArrow('updateTime')}</div> */}
                <span className="absolute left-[7.9rem] h-[100%] w-[1px] bg-gray-300" />
              </div>
            </th>
            <th className="p-[1rem]">코치메모</th>
            <th className="p-[1rem]">피드백 수</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} className="border-b dark:text-gray-5">
              <td className="p-[1rem]">{item.display_name}</td>
              <td className="p-[1rem]">{item.name}</td>
              <td className="p-[1rem]">{renderMealsDots(item.meals)}</td>
              <td className="p-[1rem]">200% /2회</td>
              <td className="p-[1rem]">{item.coach_memo}</td>
              <td className="p-[1rem]">{item.feedback_counts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DietTable;
