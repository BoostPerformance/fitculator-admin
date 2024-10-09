const DietTable = ({ data }: { data: any[] }) => {
  return (
    <div className="mt-6">
      <table className="table-auto w-full bg-white shadow-md rounded-md">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-4">ID</th>
            <th className="p-4">이름</th>
            <th className="p-4">아침</th>
            <th className="p-4">점심</th>
            <th className="p-4">저녁</th>
            <th className="p-4">간식</th>
            <th className="p-4">업데이트 시간</th>
            <th className="p-4">피드백 현황</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="p-4">{item.id}</td>
              <td className="p-4">{item.name}</td>
              <td className="p-4">{item.morning}</td>
              <td className="p-4">{item.lunch}</td>
              <td className="p-4">{item.dinner}</td>
              <td className="p-4">{item.snack}</td>
              <td className="p-4">{item.updateTime}</td>
              <td className="p-4">{item.feedback}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DietTable;
