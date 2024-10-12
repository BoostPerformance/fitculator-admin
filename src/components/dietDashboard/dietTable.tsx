import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';

const sortData = (data: any[], sortBy: string, sortDirection: boolean) => {
  return [...data].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name, 'ko') * (sortDirection ? 1 : -1);
    } else if (sortBy === 'id') {
      return (a.id - b.id) * (sortDirection ? 1 : -1);
    } else if (sortBy === 'updateTime') {
      return (
        a.updateTime.localeCompare(b.updateTime) * (sortDirection ? 1 : -1)
      );
    }
    return 0; // 기본적으로 변경 없을 때
  });
};

const DietTable = ({ data }: { data: any[] }) => {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<string>('id'); // 정렬 기준
  const [sortDirection, setSortDirection] = useState<boolean>(true); // true: 오름차순, false: 내림차순

  const handleSort = (key: string) => {
    if (sortBy === key) {
      // 동일한 기준으로 다시 클릭 시 방향만 변경
      setSortDirection(!sortDirection);
    } else {
      setSortBy(key);
      setSortDirection(true); // 새 기준으로 정렬할 때는 기본 오름차순으로 설정
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

  return (
    <div className="mt-[1.4rem]">
      <table className="table-auto w-full bg-white shadow-md rounded-md">
        <thead>
          <tr className="bg-gray-100 text-left text-1-500 text-gray-6">
            <th className="p-[1rem]" onClick={() => handleSort('id')}>
              <div className="relative flex justify-between items-center">
                <div>ID</div>
                <div>{renderSortArrow('id')}</div>
                <span className="absolute left-[6.3rem] h-[100%] w-[1px] bg-gray-300"></span>
              </div>
            </th>
            <th
              className="p-[1rem] w-[6rem] "
              onClick={() => handleSort('name')}
            >
              <div className="relative flex justify-between items-center">
                <div>이름</div>
                <div>{renderSortArrow('name')}</div>
                <span className="absolute left-[5.4rem] h-[100%] w-[1px] bg-gray-300"></span>
              </div>
            </th>
            <th className="p-[1rem]">
              <div className="relative p-[1rem] flex justify-between items-center">
                <div>아침</div>
                <span className="absolute left-[11.4rem] h-[50%] w-[1px] bg-gray-300"></span>
              </div>
            </th>
            <th className="p-[1rem]">
              <div className="relative p-[1rem] flex justify-between items-center">
                <div>점심</div>
                <span className="absolute left-[10.4rem] h-[50%] w-[1px] bg-gray-300"></span>
              </div>
            </th>
            <th className="p-[1rem]">
              <div className="relative p-[1rem] flex justify-between items-center">
                <div>저녁</div>
                <span className="absolute left-[11.4rem] h-[50%] w-[1px] bg-gray-300"></span>
              </div>
            </th>
            <th className="p-[1rem]">
              <div className="relative p-[1rem] flex justify-between items-center">
                <div>간식</div>
                <span className="absolute left-[11.4rem] h-[50%] w-[1px] bg-gray-300"></span>
              </div>
            </th>

            <th
              className="p-[1rem] w-[9rem]"
              onClick={() => handleSort('updateTime')}
            >
              <div className="relative flex justify-between items-center">
                <div>업데이트 시간</div>
                <div>{renderSortArrow('updateTime')}</div>
                <span className="absolute left-[7.9rem] h-[100%] w-[1px] bg-gray-300" />
              </div>
            </th>
            <th className="p-[1rem]">피드백 현황</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="p-[1rem]">{item.discordId}</td>
              <td className="p-[1rem]">{item.name}</td>
              <td className="p-[1rem]">{item.morning}</td>
              <td className="p-[1rem]">{item.lunch}</td>
              <td className="p-[1rem]">{item.dinner}</td>
              <td className="p-[1rem]">{item.snack}</td>
              <td className="p-[1rem]">{item.updateTime}</td>
              <td className="p-[1rem]">
                <button
                  className={`px-[0.625rem] py-[0.5rem] rounded-[0.5rem] w-[5.9375rem] h-[1.8125rem] flex items-center justify-center text-0.875-400 ${
                    item.feedback === '14/14' ? 'bg-green-500' : 'bg-[#FF9257]'
                  }`}
                  onClick={() => {
                    router.push(`/user/diet/${item.id}`);
                  }}
                >
                  {item.feedback}
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
