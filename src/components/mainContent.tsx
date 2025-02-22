import { useState } from "react";
import Title from "./layout/title";
import ChallengeStatistics from "./statistics/challengeStatistics";
import { ChallengeParticipant, Challenges } from "@/types/userPageTypes";
import GraphSection from "./graph/graphSection";
//import ResponsiveImages from './responsiveImages';
import DietTable from "./dietDashboard/dietTable";

interface MainContentProps {
  challengeTitle: string;
  dailyRecords: ChallengeParticipant[];
  selectedChallengeId: string;
  challenges: Challenges[];
}

const MainContent: React.FC<MainContentProps> = ({
  challengeTitle,
  dailyRecords,
  selectedChallengeId,
  challenges,
}) => {
  const [page, setPage] = useState(1);

  const handleLoadMore = (nextPage: number) => {
    setPage(nextPage);
    // 여기서 추가 데이터를 로드하는 로직이 필요합니다.
    // 현재는 dailyRecords가 상위 컴포넌트에서 전달되므로,
    // 상위 컴포넌트에서 페이지네이션을 처리해야 합니다.
  };
  return (
    <div className="flex-1 overflow-auto">
      <div className="pt-[2rem] md:pt-0">
        <Title title={challengeTitle} />

        <ChallengeStatistics
          dailyRecords={dailyRecords}
          selectedChallengeId={selectedChallengeId}
          challenges={challenges}
        />

        <GraphSection
          activities={dailyRecords}
          selectedChallengeId={selectedChallengeId}
        />

        <div className="dark:bg-blue-4 bg-gray-100 lg:pt-[3rem] sm:pt-[2rem] bg-white-1">
          <DietTable
            dailyRecordsData={dailyRecords}
            challengeId={selectedChallengeId}
            onLoadMore={handleLoadMore}
          />
        </div>
      </div>
    </div>
  );
};

export default MainContent;
