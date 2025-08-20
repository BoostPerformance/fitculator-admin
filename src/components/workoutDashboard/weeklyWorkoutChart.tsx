import { WeeklyWorkout } from '@/components/hooks/useWorkoutData';
import { useRouter, useParams } from 'next/navigation';

interface WeeklyWorkoutChartProps {
  userName: string;
  weeklyWorkouts?: WeeklyWorkout[];
  userId?: string; // 사용자 ID
  weekNumberParam?: number;
  fetchedUserName?: string; // 사용자명
  username?: string | null; // 사용자 username
}

export default function WeeklyWorkoutChart({
  userName = '사용자',
  weeklyWorkouts = [],
  userId = 'USER',
  weekNumberParam,
  fetchedUserName,
  username,
}: WeeklyWorkoutChartProps) {
  const router = useRouter();
  const params = useParams();
  const challengeId = params.challengeId as string;

  // 주차 클릭 핸들러
  const handleWeekClick = (weekNumber: number, label: string) => {
    const targetUrl = `/${challengeId}/workout/${userId}/${weekNumber}?label=${label}`;
    router.push(targetUrl);
  };
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
      <div className="bg-white rounded-lg px-6 py-1.5 mb-4 shadow-sm border border-gray-200 w-full overflow-x-auto">
        {/* 데스크탑 레이아웃 */}
        <div className="sm:hidden block w-full overflow-x-auto">
          <table className="w-full text-sm min-w-max">
            <thead>
              <tr className="text-gray-500 text-xs">
                <th className="text-left">Week no.</th>
                {weeklyWorkouts.map((week, index) => {
                  const [startDate, endDate] = week.label.split('-');
                  const formatDate = (date: string) => {
                    const [month, day] = date.split('.');
                    return `${month.replace(/^0/, '')}.${day.replace(/^0/, '')}`;
                  };
                  const isCurrentWeek = week.weekNumber === weekNumberParam;
                  return (
                    <th key={index} className="text-center" style={isCurrentWeek ? {backgroundColor: '#eff6ff'} : {}}>
                      <span className={isCurrentWeek ? 'text-blue-600 font-semibold' : ''}>
                        W{week.weekNumber}
                      </span>
                      <br />
                      <span className="text-xs font-light">
                        {formatDate(startDate)}-{formatDate(endDate)}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-100">
                <td className="py-2 text-left">
                  <div className="text-gray-500">유산소</div>
                  <div className="text-gray-500">근력</div>
                </td>
                {weeklyWorkouts.map((week, index) => {
                  const isCurrentWeek = week.weekNumber === weekNumberParam;
                  return (
                    <td 
                      key={index} 
                      className={`py-2 text-center cursor-pointer hover:bg-gray-50 transition-colors`}
                      style={isCurrentWeek ? {backgroundColor: '#eff6ff'} : {}}
                      onClick={() => handleWeekClick(week.weekNumber, week.label)}
                    >
                      <div className={`text-blue-500 ${isCurrentWeek ? 'font-semibold' : ''}`}>
                        {`${week.totalAchievement}%`}
                      </div>
                      <div className="text-gray-500 text-sm">
                        {week.totalSessions}
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
        {/* 모바일 레이아웃 */}
        <div className="sm:block hidden">
          <div className="flex justify-between text-gray-500 text-xs border-b pb-2">
            <div>Week no.</div>
            <div>유산소 / 근력</div>
          </div>

          {weeklyWorkouts.map((week, index) => {
            const isCurrentWeek = week.weekNumber === weekNumberParam;
            return (
              <div
                key={index}
                className={`${
                  index < weeklyWorkouts.length - 1 ? 'border-b py-3' : 'py-3'
                } cursor-pointer hover:bg-gray-50 transition-colors`}
                style={isCurrentWeek ? {backgroundColor: '#eff6ff'} : {}}
                onClick={() => handleWeekClick(week.weekNumber, week.label)}
              >
                <div className="flex justify-between items-center">
                  <div className={`text-gray-500 ${isCurrentWeek ? 'text-blue-600' : ''}`}>
                    <span className={isCurrentWeek ? 'font-semibold' : ''}>
                      W{week.weekNumber}
                    </span>
                    <br />
                    <span className="text-xs font-light">
                      {(() => {
                        const [startDate, endDate] = week.label.split('-');
                        const formatDate = (date: string) => {
                          const [month, day] = date.split('.');
                          return `${month.replace(/^0/, '')}.${day.replace(/^0/, '')}`;
                        };
                        return `${formatDate(startDate)}-${formatDate(endDate)}`;
                      })()}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={`text-blue-500 ${isCurrentWeek ? 'font-semibold' : ''}`}>
                      {`${week.totalAchievement}%`}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {week.totalSessions}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
