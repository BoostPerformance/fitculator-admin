import Title from './layout/title';
import ChallengeStatistics from './statistics/challengeStatistics';
import { ChallengeParticipant, Challenges } from '@/types/userPageTypes';
import GraphSection from './graph/graphSection';
import ResponsiveImages from './responsiveImages';
import DietTable from './dietDashboard/dietTable';

interface MainContentProps {
  challengeTitle: string;
  dailyRecords: ChallengeParticipant[];
  selectedChallengeId: string;
  challenges: Challenges[];
  isMobile: boolean;
  coachMemo?: string;
}

const MainContent: React.FC<MainContentProps> = ({
  challengeTitle,
  dailyRecords,
  selectedChallengeId,
  challenges,
  isMobile,
  coachMemo,
}) => {
  return (
    <div className="flex-1 overflow-auto">
      <div className="pt-[2rem] md:pt-0">
        <Title title={challengeTitle} />

        <ChallengeStatistics
          dailyRecords={dailyRecords}
          selectedChallengeId={selectedChallengeId}
          challenges={challenges}
        />

        <GraphSection activities={dailyRecords} />

        <ResponsiveImages isMobile={isMobile} />

        <div className="dark:bg-blue-4 bg-gray-100 lg:pt-[3rem] sm:pt-[2rem] bg-white-1">
          <DietTable dailyRecordsData={dailyRecords} />
        </div>
      </div>
    </div>
  );
};

export default MainContent;
