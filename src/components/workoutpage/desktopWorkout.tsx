import TotalFeedbackCounts from '../totalCounts/totalFeedbackCount';
import WeeklyWorkoutChart from '../workoutDashboard/weeklyWorkoutChart';
import TextBox from '../textBox';
import { CustomAlert } from '../layout/customAlert';
import Image from 'next/image';
import { generateBarChart, generateDonutChart } from '../graph/generateCharts';

interface DesktopWorkoutProps {
  userId: string;
  userData: any;
  totalPoints: number;
  currentWeekData: any;
  coachFeedback: string;
  setCoachFeedback: (value: string) => void;
  handleFeedbackSave: (feedback: string) => Promise<void>;
  fetchedUserName: string;
  handleBack: () => void;
  isDisable: boolean;
  showAlert: boolean;
  copyMessage: boolean;
  setShowAlert: (value: boolean) => void;
  setCopyMessage: (value: boolean) => void;
  setIsDisable: (value: boolean) => void;
}

export default function DesktopWorkout({
  userId,
  userData,
  totalPoints,
  currentWeekData,
  coachFeedback,
  setCoachFeedback,
  handleFeedbackSave,
  fetchedUserName,
  handleBack,
  isDisable,
  showAlert,
  copyMessage,
  setShowAlert,
  setCopyMessage,
  setIsDisable,
}: DesktopWorkoutProps) {
  return (
    <div className="flex w-full p-4 sm:hidden">
      <div className="w-full md:w-4/6 mr-2 flex flex-col gap-5">
        <div className="font-bold mb-1">
          {fetchedUserName || userData.name} 님의 운동현황
        </div>
        <div className="w-1/3 sm:w-full">
          <TotalFeedbackCounts
            counts={`${totalPoints}pt`}
            title="총 운동포인트"
            borderColor="border-blue-500"
            textColor="text-blue-500"
          />
        </div>
        <div className="font-bold mb-4">주간운동 그래프</div>
        <div>
          <WeeklyWorkoutChart
            userName={userData.name}
            weeklyWorkouts={userData.weeklyWorkouts}
            userId={userId}
          />

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="font-bold mb-4">
              이번 주 운동 그래프 ({currentWeekData.label})
            </div>
            <div className="flex gap-6 mb-6 sm:flex-col sm:gap-6">
              <div className="flex flex-col items-center w-1/3 sm:w-full">
                <div className="relative w-full">
                  {generateDonutChart(
                    currentWeekData.workoutTypes,
                    false,
                    totalPoints
                  )}
                </div>
                <div className="flex justify-between text-sm mt-4 w-full bg-gray-8 px-[1.875rem] py-[1.25rem] md:px-[0.7rem] ">
                  <div className="text-gray-500 ">근력 운동</div>
                  <div className="text-blue-500 text-2.5-900 pt-5 md:text-1.5-900">
                    {currentWeekData.totalSessions || 0}
                    <span className="text-1.75-900 md:text-1.25-900">/2회</span>
                  </div>
                </div>
                <button
                  className="pt-[6rem] text-gray-400 font-bold hover:font-extrabold cursor-pointer sm:px-[2rem] sm:hidden lg:block md:block"
                  onClick={handleBack}
                >
                  ← 목록으로
                </button>
              </div>
              <div className="flex flex-col w-2/3 sm:w-full sm:items-start ">
                <div className="flex items-end mb-4">
                  {generateBarChart(
                    currentWeekData.dailyWorkouts,
                    currentWeekData.totalSessions
                  )}
                </div>
                <div>
                  <TextBox
                    title="코치 피드백"
                    value={coachFeedback}
                    placeholder="피드백을 작성하세요."
                    button1="남기기"
                    Btn1className="bg-green text-white"
                    svg1="/svg/send.svg"
                    onChange={(e) => setCoachFeedback(e.target.value)}
                    onSave={async (feedback) => {
                      await handleFeedbackSave(feedback);
                    }}
                    isFeedbackMode={true}
                    copyIcon
                  />
                </div>
                <button
                  className="pt-[6rem] text-gray-400 font-bold hover:font-extrabold cursor-pointer sm:px-[2rem] sm:block lg:hidden md:hidden"
                  onClick={handleBack}
                >
                  ← 목록으로
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CustomAlert
        message={
          copyMessage
            ? '복사가 완료되었습니다.'
            : isDisable
            ? '피드백 작성이 완료되었습니다.'
            : '피드백 작성이 실패했습니다.'
        }
        isVisible={showAlert || copyMessage}
        onClose={() => {
          setShowAlert(false);
          setCopyMessage(false);
          setIsDisable(false);
        }}
      />
    </div>
  );
}
