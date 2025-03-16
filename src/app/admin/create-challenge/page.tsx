'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateChallenge() {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          start_date: startDate,
          end_date: endDate,
        }),
      });

      if (!response.ok) {
        throw new Error('챌린지 생성에 실패했습니다.');
      }

      const data = await response.json();
      alert('챌린지가 성공적으로 생성되었습니다!');
      router.push(`/user/${data.id}`);
    } catch (error) {
      console.error('Error creating challenge:', error);
      alert('챌린지 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">챌린지 생성</h1>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto">
        <div className="mb-4">
          <label
            htmlFor="title"
            className="block mb-2 font-medium dark:text-white"
          >
            챌린지 제목
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-3 dark:border-blue-2 dark:text-white"
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="startDate"
            className="block mb-2 font-medium dark:text-white"
          >
            시작 날짜
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-3 dark:border-blue-2 dark:text-white"
            required
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="endDate"
            className="block mb-2 font-medium dark:text-white"
          >
            종료 날짜
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-3 dark:border-blue-2 dark:text-white"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '처리 중...' : '챌린지 생성'}
        </button>
      </form>
    </div>
  );
}
