import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCoachMemo } from '@/components/hooks/useCoachMemo';

interface ModalProps {
  onClose: () => void;
  participantId?: string;
  challengeId?: string;
  serviceUserId: string;
  coach_memo?: string;
  memo_record_date?: Date;
  onSave?: (memo: string) => void; // onSave prop 추가
}

export default function Modal({
  onClose,
  participantId,
  challengeId,
  serviceUserId,
  coach_memo,
  // memo_record_date,
  onSave,
}: ModalProps) {
  const [coachMemo, setCoachMemo] = useState(coach_memo);
  // const [memoDate, setMemoDate] = useState<Date | null>(
  //   memo_record_date || null
  // );

  const router = useRouter();
  const { saveCoachMemo, isLoading } = useCoachMemo();

  const handleMemoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMemo = e.target.value;
    setCoachMemo(newMemo);

    // 메모가 있을 때만 날짜 업데이트
    // if (newMemo.trim()) {
    //   setMemoDate(new Date());
    // }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // if (!coachMemo.trim()) {
    //   alert('메모 내용을 입력해주세요.');
    //   return;
    // }

    try {
      await saveCoachMemo({
        participant_id: participantId!,
        challenge_id: challengeId!,
        coach_memo: coachMemo,
        // memo_record_date: memoDate,
        serviceUserId: serviceUserId,
      });

      //console.log('coachMemo', coachMemo);

      if (onSave) {
        // console.log('coachMemo', coachMemo);
        onSave(coachMemo);
      }

      // 성공 시 페이지 새로고침
      router.refresh();
      onClose();
    } catch (err) {
      console.error('Error submitting coach memo:', err);
      alert('메모 저장 중 오류가 발생했습니다.');
    }
  };

  // const handleMemoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  //   setCoachMemo(e.target.value);
  // };

  // const formatDate = (date: Date | null) => {
  //   if (!date) return '';

  //   const d = new Date(date);

  //   const year = d.getFullYear();
  //   const month = String(d.getMonth() + 1).padStart(2, '0');
  //   const day = String(d.getDate()).padStart(2, '0');
  //   const hours = String(d.getHours()).padStart(2, '0');
  //   const minutes = String(d.getMinutes()).padStart(2, '0');

  //   return `${year}-${month}-${day} ${hours}:${minutes}`;
  // };
  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 ">
        <div className="bg-white rounded-lg p-6 w-[30rem] shadow-xl sm:w-[22rem]">
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-col">
              <h2 className="text-lg font-medium">코치메모</h2>
              {/* <h3>{formatDate(memoDate)}</h3> */}
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <textarea
              value={coachMemo}
              onChange={handleMemoChange}
              className="w-full h-32 p-2 border border-gray-300 rounded-md resize-none"
              placeholder="메모를 남겨주세요!"
              required
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-[3rem] py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                닫기
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-[3rem] py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                저장
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
