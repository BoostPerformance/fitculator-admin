const DietTable = ({ data }: { data: any[] }) => {
  return (
    <div className="mt-6">
      <table className="table-auto w-full bg-white shadow-md rounded-md">
        <thead>
          <tr className="bg-gray-100 text-left dark:text-gray-5 text-1-500">
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
            <tr key={item.id} className="border-b dark:text-gray-5">
              <td className="p-[1rem]">{item.discordId}</td>
              <td className="p-[1rem]">{item.name}</td>
              <td className="p-[1rem]">{item.morning}</td>
              <td className="p-[1rem]">{item.lunch}</td>
              <td className="p-[1rem]">{item.dinner}</td>
              <td className="p-[1rem]">{item.snack}</td>
              <td className="p-[1rem]">{item.updateTime}</td>
              <td className="p-[1rem]">{item.feedback}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DietTable;
