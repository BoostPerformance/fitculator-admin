import { useRouter } from 'next/navigation';

const DietTable = ({ data }: { data: any[] }) => {
  const router = useRouter();

  return (
    <div className="mt-6">
      <table className="table-auto w-full bg-white shadow-md rounded-md">
        <thead>
          <tr className="bg-gray-100 text-left text-1-500">
            <th className="p-[1rem]">ID</th>
            <th className="p-[1rem]">이름</th>
            <th className="p-[1rem]">아침</th>
            <th className="p-[1rem]">점심</th>
            <th className="p-[1rem]">저녁</th>
            <th className="p-[1rem]">간식</th>
            <th className="p-[0.1rem]">업데이트 시간</th>
            <th className="p-[1rem]">피드백 현황</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
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
                  className="bg-[#FF9257] px-[0.625rem] py-[0.5rem] rounded-[0.5rem] w-[5.9375rem] h-[1.8125rem] flex items-center justify-center text-0.875-400"
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
