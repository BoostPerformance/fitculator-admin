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
    <div className="bg-white p-4 shadow rounded-lg">
      <h2 className="text-lg font-semibold mb-4 text-black">Top Referrals</h2>
      <ul>
        {referrals.map((referral, idx) => (
          <li
            key={idx}
            className="flex justify-between py-2 border-b text-black"
          >
            <span>{referral.source}</span>
            <span>{referral.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
