import Dashboard from './dashboard/page';
import Header from '@/components/userPage/dashboardHeader';
import Sidebar from '@/components/userPage/sidebar';

export default function User() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-6 bg-gray-100 flex-1">
          <Dashboard />
        </main>
      </div>
    </div>
  );
}
