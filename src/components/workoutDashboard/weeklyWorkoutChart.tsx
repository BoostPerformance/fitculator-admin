interface WeeklyWorkoutChartProps {
  userName: string;
}

export default function WeeklyWorkoutChart({
  userName,
}: WeeklyWorkoutChartProps) {
  return (
    <>
      <div className="bg-white rounded-lg p-6 mb-4 shadow-sm">
        <div className="sm:hidden block">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs">
                <th className="py-2 text-left">ID</th>
                <th className="py-2 text-left">이름</th>
                <th className="py-2 text-center">
                  1주차
                  <br />
                  (03.20~)
                </th>
                <th className="py-2 text-center">
                  2주차
                  <br />
                  (03.27~)
                </th>
                <th className="py-2 text-center">
                  3주차
                  <br />
                  (10.13~)
                </th>
                <th className="py-2 text-center">
                  4주차
                  <br />
                  (10.21~)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-100">
                <td className="py-4 text-left">
                  Ashly
                  <br />
                  ###227
                </td>
                <td className="py-4 text-left">{userName}</td>
                <td className="py-4 text-center text-blue-500">100% / 1회</td>
                <td className="py-4 text-center text-blue-500">100% / 2회</td>
                <td className="py-4 text-center text-blue-500">100% / 2회</td>
                <td className="py-4 text-center text-blue-500">90% / 1회</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Vertical layout for small screens */}
        <div className="sm:block hidden">
          <div className="flex justify-between text-gray-500 text-xs border-b pb-2">
            <div>주차</div>
            <div>유사도 / 근력</div>
          </div>

          <div className="border-b py-3">
            <div className="flex justify-between items-center">
              <div className="text-gray-500">
                1주차
                <br />
                (9.30~)
              </div>
              <div className="text-blue-500">100% / 1회</div>
            </div>
          </div>

          <div className="border-b py-3">
            <div className="flex justify-between items-center">
              <div className="text-gray-500">
                2주차
                <br />
                (10.07~)
              </div>
              <div className="text-blue-500">100% / 1회</div>
            </div>
          </div>

          <div className="border-b py-3">
            <div className="flex justify-between items-center">
              <div className="text-gray-500">
                3주차
                <br />
                (10.14~)
              </div>
              <div className="text-blue-500">100% / 1회</div>
            </div>
          </div>

          <div className="py-3">
            <div className="flex justify-between items-center">
              <div className="text-gray-500">
                3주차
                <br />
                (10.14~)
              </div>
              <div className="text-blue-500">100% / 1회</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
