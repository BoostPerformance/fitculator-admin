import DietItemContainer from '@/components/dietItemContainer';
import FixedBars from '@/components/fixedBars/fixedBars';

export default function DietItem() {
  return (
    <div className="bg-white-1">
      <FixedBars />
      <DietItemContainer />
    </div>
  );
}
