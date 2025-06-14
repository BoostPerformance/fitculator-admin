import { WeeklyWorkout } from '@/components/hooks/useWorkoutData';

interface WeeklyWorkoutChartProps {
  userName: string;
  weeklyWorkouts?: WeeklyWorkout[];
  userId?: string; // 사용자 ID
  weekNumberParam?: number;
}

export default function WeeklyWorkoutChart({
  userName = '사용자',
  weeklyWorkouts = [],
  userId = 'USER',
  weekNumberParam,
}: WeeklyWorkoutChartProps) {
  if (!weeklyWorkouts || weeklyWorkouts.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 mb-4 shadow-sm">
        <p className="text-center text-gray-500">
          주간 운동 데이터가 없습니다.
        </p>
      </div>
    );
  }

  // 사용자 ID의 마지막 3자리 (또는 전체)를 표시
  const displayId =
    userId.length > 3 ? userId.substring(userId.length - 3) : userId;

  return (
    <>
      <div className="bg-white rounded-lg p-6 mb-4 shadow-sm">
        {/* 데스크탑 레이아웃 */}
        <div className="sm:hidden block">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs">
                <th className="py-2 text-left">ID</th>
                <th className="py-2 text-left">이름</th>
                {weeklyWorkouts.map((week, index) => {
                  return (
                    <th key={index} className="py-2 text-center">
                      {`${weekNumberParam}주차`}
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
                  {userName.substring(0, 5)}
                  <br />
                  ###{displayId}
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
                  {`${weekNumberParam}주차`}
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
