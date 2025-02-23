import { ChallengeParticipant } from "@/types/userPageTypes";
import TrafficSourceChart from "./trafficSourceChart";
import DailyDietRecord from "./dailyDietRecord";
import WorkoutLeaderboard from "./workoutLeaderboard";
import DailyDietRecordMobile from "./dailyDietRecordMobile";
import { useEffect, useState } from "react";

interface GraphSectionProps {
  activities: ChallengeParticipant[];
  selectedChallengeId: string;
}

const GraphSection: React.FC<GraphSectionProps> = ({
  activities,
  selectedChallengeId,
}) => {
  return (
    <div className="dark:bg-blue-4 grid grid-cols-7 gap-[1rem] my-6 sm:grid-cols-1 md:grid-cols-1 md:px-[2rem] grid-rows-1">
      <TrafficSourceChart challengeId={selectedChallengeId} />
      <WorkoutLeaderboard challengeId={selectedChallengeId} />
      <DailyDietRecord activities={activities} />
      <DailyDietRecordMobile activities={activities} />
    </div>
  );
};

export default GraphSection;
