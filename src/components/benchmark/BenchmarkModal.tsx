'use client';
import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

interface BenchmarkModalProps {
  benchmark?: {
    id: string;
    title: string;
    description: string;
    unit: 'time' | 'distance' | 'weight' | 'reps' | 'custom';
    unit_label: string;
    is_lower_better: boolean;
  } | null;
  onClose: () => void;
  onSave: (data: any) => void;
}

export default function BenchmarkModal({ benchmark, onClose, onSave }: BenchmarkModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    unit: 'time' as 'time' | 'distance' | 'weight' | 'reps' | 'custom',
    unit_label: 'mm:ss',
    is_lower_better: true,
  });

  useEffect(() => {
    if (benchmark) {
      setFormData({
        title: benchmark.title,
        description: benchmark.description || '',
        unit: benchmark.unit,
        unit_label: benchmark.unit_label,
        is_lower_better: benchmark.is_lower_better,
      });
    }
  }, [benchmark]);

  const unitOptions = {
    time: ['mm:ss', 'hh:mm:ss'],
    distance: ['m', 'km', 'mile'],
    weight: ['kg', 'lbs'],
    reps: ['reps', 'count', 'sets'],
    custom: [],
  };

  const handleUnitChange = (unit: typeof formData.unit) => {
    const defaultLabel = unitOptions[unit]?.[0] || '';
    setFormData({ 
      ...formData, 
      unit, 
      unit_label: defaultLabel,
      is_lower_better: unit === 'time' || unit === 'distance'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (benchmark?.id) {
      onSave({ ...formData, id: benchmark.id });
    } else {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {benchmark ? '벤치마크 수정' : '새 벤치마크 추가'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">제목</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 5km 달리기"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">설명</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="벤치마크에 대한 설명을 입력하세요"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">측정 단위</label>
            <select
              value={formData.unit}
              onChange={(e) => handleUnitChange(e.target.value as typeof formData.unit)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="time">시간</option>
              <option value="distance">거리</option>
              {/* <option value="weight">무게</option>
              <option value="reps">횟수</option>
              <option value="custom">사용자 정의</option> */}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">단위 표시</label>
            {formData.unit === 'custom' ? (
              <input
                type="text"
                value={formData.unit_label}
                onChange={(e) => setFormData({ ...formData, unit_label: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 점"
                required
              />
            ) : (
              <select
                value={formData.unit_label}
                onChange={(e) => setFormData({ ...formData, unit_label: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {unitOptions[formData.unit].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">순위 기준</label>
            <select
              value={formData.is_lower_better ? 'lower' : 'higher'}
              onChange={(e) => setFormData({ ...formData, is_lower_better: e.target.value === 'lower' })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="lower">낮을수록 좋음 (예: 시간 기록)</option>
              <option value="higher">높을수록 좋음 (예: 무게, 횟수)</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              {benchmark ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}