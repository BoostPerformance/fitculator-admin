'use client';
import DashboardHeader from './dashboardHeader';
import Sidebar from './sidebar';
import { useState } from 'react';

export default function FixedBars() {
  const [isOpen, setIsOpen] = useState(true);

  const handleSidebarOpen = () => {
    setIsOpen(!isOpen);
  };
  return (
    <>
      <Sidebar onClick={handleSidebarOpen} />
      <DashboardHeader isOpen={isOpen} />
    </>
  );
}
