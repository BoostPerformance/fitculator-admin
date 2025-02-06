import Image from 'next/image';
const ResponsiveImages: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
  return (
    <div>
      <Image
        src={isMobile ? '/image/graph-example2.png' : '/image/cardio-graph.png'}
        width={4000}
        height={4000}
        alt={isMobile ? 'graph-example1.png' : 'cardio-graph.png'}
        className="w-full lg:col-span-3"
      />
      {!isMobile && (
        <Image
          src="/image/weight-graph.png"
          width={4000}
          height={4000}
          alt=""
          className="w-full lg:col-span-3"
        />
      )}
    </div>
  );
};
export default ResponsiveImages;
