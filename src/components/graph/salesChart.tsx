import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SalesChart() {
  const data = [
    { month: 'Jan', sales: 30000 },
    { month: 'Feb', sales: 45000 },
    { month: 'Mar', sales: 25000 },
    { month: 'Apr', sales: 50000 },
    { month: 'May', sales: 40000 },
    { month: 'Jun', sales: 35000 },
    { month: 'Jul', sales: 60000 },
    { month: 'Aug', sales: 70000 },
    { month: 'Sep', sales: 80000 },
    { month: 'Oct', sales: 75000 },
    { month: 'Nov', sales: 65000 },
    { month: 'Dec', sales: 50000 },
  ];

  return (
    <div className="bg-white p-4 shadow rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Sales</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="sales" fill="rgba(54, 162, 235, 0.6)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}