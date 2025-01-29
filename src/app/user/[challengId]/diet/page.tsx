'use client';
import { useState, useEffect } from 'react';
import DietItemContainer from '@/components/dietItemContainer';

export default function DietItem() {
  const [meals, setMeals] = useState([]);

  useEffect(() => {
    const mealResponse = async () => {
      const response = await fetch('/api/meals');
      const data = await response.json();
      setMeals(data);
    };
    mealResponse();
  }, []);
  console.log(meals);

  return (
    <div className="bg-white-1">
      식단페이지
      <DietItemContainer />
    </div>
  );
}
