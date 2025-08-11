import { WeeklyWorkout } from '@/components/hooks/useWorkoutData';

interface WeeklyWorkoutChartProps {
  userName: string;
  weeklyWorkouts?: WeeklyWorkout[];
  userId?: string; // 사용자 ID
  weekNumberParam?: number;
  fetchedUserName?: string; // 사용자명
}

export default function WeeklyWorkoutChart({
  userName = '사용자',
  weeklyWorkouts = [],
  userId = 'USER',
  weekNumberParam,
  fetchedUserName,
}: WeeklyWorkoutChartProps) {
  if (!weeklyWorkouts || weeklyWorkouts.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 mb-4 shadow-sm border border-gray-200">
        <p className="text-center text-gray-500">
          주간 운동 데이터가 없습니다.
        </p>
      </div>
    );
  }

  // fetchedUserName이 null이면 '-', 있으면 그것을 사용
  const displayName = fetchedUserName === null || fetchedUserName === undefined ? '-' : fetchedUserName;
  const displayId = displayName === '-' ? '-' : (displayName.length > 5 ? displayName.substring(0, 5) : displayName);

  return (
    <>
      <div className="bg-white rounded-lg p-6 mb-4 shadow-sm border border-gray-200 w-full overflow-x-auto">
        {/* 데스크탑 레이아웃 */}
        <div className="sm:hidden block w-full overflow-x-auto">
          <table className="w-full text-sm min-w-max">
            <thead>
              <tr className="text-gray-500 text-xs">
                <th className="py-2 text-left">ID</th>
                <th className="py-2 text-left">이름</th>
                {weeklyWorkouts.map((week, index) => {
                  return (
                    <th key={index} className="py-2 text-center">
                      W{weekNumberParam}
                      <br />
                      {`(${week.label.split('-')[0]}~)`}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-100">
                <td className="py-4 text-left">
                  {displayId}
                  <br />
                  ###{displayName}
                </td>
                <td className="py-4 text-left">{userName}</td>
                {weeklyWorkouts.map((week, index) => (
                  <td key={index} className="py-4 text-center text-blue-500">
                    {`${week.totalAchievement}% / ${week.totalSessions}회`}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        {/* 모바일 레이아웃 */}
        <div className="sm:block hidden">
          <div className="flex justify-between text-gray-500 text-xs border-b pb-2">
            <div>주차</div>
            <div>유산소 / 근력</div>
          </div>

          {weeklyWorkouts.map((week, index) => (
            <div
              key={index}
              className={
                index < weeklyWorkouts.length - 1 ? 'border-b py-3' : 'py-3'
              }
            >
              <div className="flex justify-between items-center">
                <div className="text-gray-500">
                  W{weekNumberParam}
                  <br />
                  {`(${week.label.split('-')[0]}~)`}
                </div>
                <div className="text-blue-500">
                  {`${week.totalAchievement}% / ${week.totalSessions}회`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
