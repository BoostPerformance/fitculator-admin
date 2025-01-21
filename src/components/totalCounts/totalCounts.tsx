import Title from '../layout/title';
import TotalFeedbackCounts from '../dietDashboard/totalFeedbackCount';

interface TotalCountsProps {
  counts: string;
}

export default function TotalCounts({ counts }: TotalCountsProps) {
  return (
    <div>
      <Title title="팻다챌 챌린지 식단 현황" />
      <TotalFeedbackCounts counts={counts} total="30" />
    </div>
  );
}
