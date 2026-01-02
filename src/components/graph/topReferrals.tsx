type Referral = {
  source: string;
  value: number;
};

export default function TopReferrals() {
  const referrals: Referral[] = [
    { source: 'Facebook', value: 245 },
    { source: 'Twitter', value: 245 },
    { source: 'Google', value: 245 },
    { source: 'Youtube', value: 245 },
    { source: 'Instagram', value: 245 },
  ];

  return (
    <div className="bg-white dark:bg-blue-4 p-4 shadow rounded-lg border border-gray-200 dark:border-gray-600">
      <h2 className="text-lg font-semibold mb-4 text-black dark:text-gray-4">Top Referrals</h2>
      <ul>
        {referrals.map((referral, idx) => (
          <li
            key={idx}
            className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700 text-black dark:text-gray-4"
          >
            <span>{referral.source}</span>
            <span>{referral.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
