import DietContainer from '@/components/dietDashboard/dietContainer';
import FixedBars from '@/components/fixedBars/fixedBars';
import { getServerSession } from 'next-auth';

export default async function Diet() {
  const session = await getServerSession();

  return (
    <>
      <FixedBars />
      <DietContainer />
      {/* <pre className="w-[30rem] bg-gray-200 p-4 ml-[10rem] rounded break-words whitespace-pre-wrap">
        {JSON.stringify(session, null, 2)}
      </pre> */}
    </>
  );
}
