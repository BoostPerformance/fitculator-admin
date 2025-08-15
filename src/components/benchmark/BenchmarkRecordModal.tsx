'use client';
import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import supabase from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

interface BenchmarkRecordModalProps {
  benchmark: {
    id: string;
    title: string;
    unit: string;
    unit_label: string;
    is_lower_better: boolean;
    challenge_id?: string;
  };
  members: Array<{
    id: string;
    name: string;
    birth: string;
  }>;
  challengeStartDate?: string;
  challengeEndDate?: string;
  existingRecord?: {
    id: string;
    user_id: string;
    record_value: number;
    record_date: string;
    verification_level: string;
    workout_id?: string;
    used_original_value: boolean;
  };
  onClose: () => void;
  onSave: (data: any) => void;
}

export default function BenchmarkRecordModal({ 
  benchmark, 
  members,
  challengeStartDate,
  challengeEndDate,
  existingRecord,
  onClose, 
  onSave 
}: BenchmarkRecordModalProps) {
  const [formData, setFormData] = useState({
    user_id: existingRecord?.user_id || '',
    record_value: existingRecord?.record_value?.toString() || '',
    record_date: existingRecord?.record_date || new Date().toISOString().split('T')[0],
    verification_level: (existingRecord?.verification_level as 'self_reported' | 'photo_verified' | 'official_verified') || 'self_reported',
    workout_id: existingRecord?.workout_id || '',
    used_original_value: existingRecord?.used_original_value ?? true,
  });
  
  const [manualInput, setManualInput] = useState(existingRecord ? !existingRecord.used_original_value : false);

  // 시간 입력 초기값 설정
  const getInitialTimeInput = () => {
    if (existingRecord && benchmark.unit === 'time' && existingRecord.record_value) {
      const totalSeconds = existingRecord.record_value;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return {
        hours: hours.toString(),
        minutes: minutes.toString(),
        seconds: seconds.toString(),
      };
    }
    return { hours: '', minutes: '', seconds: '' };
  };

  const [timeInput, setTimeInput] = useState(getInitialTimeInput());

  // 선택된 멤버의 챌린지 기간 내 운동 기록 조회
  const { data: workouts, isLoading: workoutsLoading } = useQuery({
    queryKey: ['member-workouts', formData.user_id, benchmark.id, challengeStartDate, challengeEndDate],
    queryFn: async () => {
      if (!formData.user_id) return [];
      
      let query = supabase
        .from('workouts')
        .select(`
          id,
          user_id,
          start_time,
          end_time,
          title,
          points,
          duration_minutes,
          distance,
          category_id,
          created_at,
          workout_categories (
            id,
            name_ko,
            name_en,
            type_id
          )
        `)
        .eq('user_id', formData.user_id);
      
      // 챌린지 기간으로 필터링
      if (challengeStartDate) {
        query = query.gte('start_time', challengeStartDate);
      }
      if (challengeEndDate) {
        query = query.lte('start_time', challengeEndDate);
      }
      
      const { data, error } = await query
        .order('start_time', { ascending: false })
        .limit(200);

      if (error) {
        console.error('운동 기록 조회 에러:', error);
        console.error('사용자 ID:', formData.user_id);
        throw error;
      }
      
      console.log('조회된 운동 기록:', data);
      console.log('벤치마크 단위:', benchmark.unit);
      console.log('챌린지 기간:', challengeStartDate, '~', challengeEndDate);
      console.log('사용자 ID:', formData.user_id);
      
      return data || [];
    },
    enabled: !!formData.user_id,
  });

  const handleTimeChange = (field: 'hours' | 'minutes' | 'seconds', value: string) => {
    const newTimeInput = { ...timeInput, [field]: value };
    setTimeInput(newTimeInput);
    
    const hours = parseInt(newTimeInput.hours) || 0;
    const minutes = parseInt(newTimeInput.minutes) || 0;
    const seconds = parseInt(newTimeInput.seconds) || 0;
    
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    setFormData({ ...formData, record_value: totalSeconds.toString() });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // record_value 검증
    let recordValue = parseFloat(formData.record_value);
    if (isNaN(recordValue) || recordValue <= 0) {
      alert('올바른 기록 값을 입력해주세요.');
      return;
    }
    
    const recordData = {
      benchmark_id: benchmark.id,
      user_id: formData.user_id,
      record_value: recordValue,
      record_date: formData.record_date,
      verification_level: formData.verification_level,
      workout_id: formData.workout_id || null,
      used_original_value: formData.used_original_value,
    };
    
    console.log('전송할 데이터:', recordData);
    onSave(recordData);
  };

  const renderValueInput = () => {
    const isDisabled = formData.workout_id && !manualInput;
    
    if (benchmark.unit === 'time') {
      return (
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="시"
            value={timeInput.hours}
            onChange={(e) => handleTimeChange('hours', e.target.value)}
            className="w-20 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            disabled={isDisabled}
          />
          <span>:</span>
          <input
            type="number"
            placeholder="분"
            value={timeInput.minutes}
            onChange={(e) => handleTimeChange('minutes', e.target.value)}
            className="w-20 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            max="59"
            disabled={isDisabled}
          />
          <span>:</span>
          <input
            type="number"
            placeholder="초"
            value={timeInput.seconds}
            onChange={(e) => handleTimeChange('seconds', e.target.value)}
            className="w-20 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            max="59"
            disabled={isDisabled}
          />
        </div>
      );
    }
    
    return (
      <div className="flex gap-2 items-center">
        <input
          type="number"
          step="0.01"
          value={formData.record_value}
          onChange={(e) => setFormData({ ...formData, record_value: e.target.value })}
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="기록 값 입력"
          required
          disabled={isDisabled}
        />
        <span className="text-gray-600">{benchmark.unit_label}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {benchmark.title} 기록 {existingRecord ? '수정' : '추가'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. 멤버 선택 */}
          <div>
            <label className="block text-sm font-medium mb-1">멤버 선택</label>
            <select
              value={formData.user_id}
              onChange={(e) => {
                setFormData({ ...formData, user_id: e.target.value, workout_id: '' });
                setManualInput(false);
              }}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">멤버를 선택하세요</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.birth ? `${new Date().getFullYear() - new Date(member.birth).getFullYear()}세` : '나이 미상'})
                </option>
              ))}
            </select>
          </div>

          {/* 2. 운동 기록 연결 */}
          {formData.user_id && (
            <div>
              <label className="block text-sm font-medium mb-1">
                운동 기록과 연결 (선택사항)
              </label>
              {workoutsLoading ? (
                <div className="w-full px-3 py-2 border rounded-lg text-gray-500">
                  운동 기록 불러오는 중...
                </div>
              ) : workouts && workouts.length > 0 ? (
                <select
                  value={formData.workout_id}
                  onChange={(e) => {
                    const selectedWorkout = workouts.find((w: any) => w.id === e.target.value);
                    
                    if (!e.target.value) {
                      // 운동 연결 해제
                      setFormData({ 
                        ...formData, 
                        workout_id: '',
                        record_value: '',
                        used_original_value: false
                      });
                      setTimeInput({ hours: '', minutes: '', seconds: '' });
                      setManualInput(false);
                    } else if (selectedWorkout && !manualInput) {
                      // 운동 선택 및 자동 입력 (수동 입력 모드가 아닌 경우)
                      if (benchmark.unit === 'time') {
                        let totalSeconds = 0;
                        
                        if (selectedWorkout.start_time && selectedWorkout.end_time) {
                          // end_time - start_time 계산
                          const startTime = new Date(selectedWorkout.start_time);
                          const endTime = new Date(selectedWorkout.end_time);
                          const diffMs = endTime.getTime() - startTime.getTime();
                          totalSeconds = Math.floor(diffMs / 1000);
                        } else if (selectedWorkout.duration_minutes) {
                          totalSeconds = selectedWorkout.duration_minutes * 60;
                        }
                        
                        if (totalSeconds > 0) {
                          const hours = Math.floor(totalSeconds / 3600);
                          const minutes = Math.floor((totalSeconds % 3600) / 60);
                          const seconds = totalSeconds % 60;
                          
                          setTimeInput({
                            hours: hours.toString(),
                            minutes: minutes.toString(),
                            seconds: seconds.toString()
                          });
                          setFormData({
                            ...formData,
                            workout_id: e.target.value,
                            record_value: totalSeconds.toString(),
                            used_original_value: true
                          });
                        } else {
                          setFormData({
                            ...formData,
                            workout_id: e.target.value,
                            used_original_value: false
                          });
                        }
                      } else if (benchmark.unit === 'distance' && selectedWorkout.distance) {
                        setFormData({
                          ...formData,
                          workout_id: e.target.value,
                          record_value: selectedWorkout.distance.toString(),
                          used_original_value: true
                        });
                      } else {
                        setFormData({ 
                          ...formData, 
                          workout_id: e.target.value,
                          used_original_value: false
                        });
                      }
                    } else {
                      // 수동 입력 모드에서는 workout_id만 업데이트
                      setFormData({ 
                        ...formData, 
                        workout_id: e.target.value,
                        used_original_value: false
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">연결하지 않음</option>
                  {workouts.map((workout: any) => {
                    // 벤치마크 단위에 맞는 기록 표시
                    let relevantRecord = '';
                    
                    if (benchmark.unit === 'time') {
                      if (workout.start_time && workout.end_time) {
                        // end_time - start_time 계산
                        const startTime = new Date(workout.start_time);
                        const endTime = new Date(workout.end_time);
                        const diffMs = endTime.getTime() - startTime.getTime();
                        const diffMinutes = Math.floor(diffMs / (1000 * 60));
                        const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
                        
                        if (diffMinutes > 0) {
                          relevantRecord = `${diffMinutes}분 ${diffSeconds}초`;
                        } else {
                          relevantRecord = `${diffSeconds}초`;
                        }
                      } else if (workout.duration_minutes) {
                        relevantRecord = `${workout.duration_minutes}분`;
                      }
                    } else if (benchmark.unit === 'distance' && workout.distance) {
                      relevantRecord = `${workout.distance}km`;
                    }
                    
                    const workoutTitle = workout.title || 
                                       workout.workout_categories?.name_ko || 
                                       workout.workout_categories?.name_en || 
                                       '운동';
                    
                    return (
                      <option key={workout.id} value={workout.id}>
                        {new Date(workout.start_time).toLocaleDateString('ko-KR')} - {workoutTitle}
                        {relevantRecord && ` (${relevantRecord})`}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <div className="w-full px-3 py-2 border rounded-lg text-gray-500">
                  운동 기록이 없습니다
                </div>
              )}
              
              {/* 운동을 선택했을 때만 체크박스 표시 */}
              {formData.workout_id && (
                <div className="mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={manualInput}
                      onChange={(e) => {
                        setManualInput(e.target.checked);
                        if (e.target.checked) {
                          // 수동 입력 모드로 전환
                          setFormData({ ...formData, used_original_value: false });
                        } else {
                          // 자동 입력 모드로 전환 - 운동 기록 재선택하여 값 다시 로드
                          const selectedWorkout = workouts?.find((w: any) => w.id === formData.workout_id);
                          if (selectedWorkout) {
                            if (benchmark.unit === 'time') {
                              let totalSeconds = 0;
                              
                              if (selectedWorkout.start_time && selectedWorkout.end_time) {
                                // end_time - start_time 계산
                                const startTime = new Date(selectedWorkout.start_time);
                                const endTime = new Date(selectedWorkout.end_time);
                                const diffMs = endTime.getTime() - startTime.getTime();
                                totalSeconds = Math.floor(diffMs / 1000);
                              } else if (selectedWorkout.duration_minutes) {
                                totalSeconds = selectedWorkout.duration_minutes * 60;
                              }
                              
                              if (totalSeconds > 0) {
                                const hours = Math.floor(totalSeconds / 3600);
                                const minutes = Math.floor((totalSeconds % 3600) / 60);
                                const seconds = totalSeconds % 60;
                                
                                setTimeInput({
                                  hours: hours.toString(),
                                  minutes: minutes.toString(),
                                  seconds: seconds.toString()
                                });
                                setFormData({
                                  ...formData,
                                  record_value: totalSeconds.toString(),
                                  used_original_value: true
                                });
                              }
                            } else if (benchmark.unit === 'distance' && selectedWorkout.distance) {
                              setFormData({
                                ...formData,
                                record_value: selectedWorkout.distance.toString(),
                                used_original_value: true
                              });
                            }
                          }
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">기록 별도 입력</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* 3. 기록 값 입력 - 운동 선택하거나 수동 입력 모드일 때만 표시 */}
          {(formData.workout_id || formData.user_id) && (
            <div>
              <label className="block text-sm font-medium mb-1">
                기록 값 {formData.workout_id && !manualInput && '(자동 입력됨)'}
              </label>
              <div className={formData.workout_id && !manualInput ? 'opacity-50' : ''}>
                {renderValueInput()}
              </div>
            </div>
          )}

          {/* 4. 측정 날짜 */}
          <div>
            <label className="block text-sm font-medium mb-1">측정 날짜</label>
            <input
              type="date"
              value={formData.record_date}
              onChange={(e) => setFormData({ ...formData, record_date: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* 5. 인증 수준 */}
          <div>
            <label className="block text-sm font-medium mb-1">인증 수준</label>
            <select
              value={formData.verification_level}
              onChange={(e) => setFormData({ ...formData, verification_level: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="self_reported">직접 인증</option>
              <option value="photo_verified">사진 인증</option>
              <option value="official_verified">공식 인증</option>
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
              {existingRecord ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}