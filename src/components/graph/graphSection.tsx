import { ChallengeParticipant } from '@/types/userPageTypes';
import TrafficSourceChart from './trafficSourceChart';
import DailyDietRecord from './dailyDietRecord';
import WorkoutLeaderboeard from './workoutLeaderboeard';

interface GraphSectionProps {
  activities: ChallengeParticipant[];
}

const GraphSection: React.FC<GraphSectionProps> = ({ activities }) => {
  return (
    <div className="dark:bg-blue-4 grid grid-cols-7 gap-[1rem] my-6 sm:flex sm:flex-col md:flex-col md:flex md:px-[2rem]">
      <TrafficSourceChart />
      <DailyDietRecord activities={activities} />
      <WorkoutLeaderboeard />
    </div>
  );
};

export default GraphSection;
