type Stat = {
  name: string;
  value: string;
  change: string;
  type: 'increase' | 'decrease';
};

export default function Stats() {
  const stats: Stat[] = [
    {
      name: 'Total Earnings',
      value: '$12,500',
      change: '10%',
      type: 'decrease',
    },
    { name: 'Total Tasks', value: '450', change: '10%', type: 'increase' },
    { name: 'Total Views', value: '255', change: '10%', type: 'increase' },
    { name: 'Total Downloads', value: '499', change: '10%', type: 'increase' },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <div key={idx} className="p-4 bg-white shadow rounded-lg">
          <div className="text-sm text-gray-500">{stat.name}</div>
          <div className="text-2xl font-semibold text-gray-900">
            {stat.value}
          </div>
          <div
            className={`text-sm ${
              stat.type === 'increase' ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {stat.change}
          </div>
        </div>
      ))}
    </div>
  );
}
