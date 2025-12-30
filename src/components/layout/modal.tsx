import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCoachMemo } from "@/components/hooks/useCoachMemo";

interface ModalProps {
  onClose: () => void;
  participantId?: string;
  challengeId?: string;
  serviceUserId: string;
  coach_memo?: string;
  memo_updated_at?: Date;
  onSave?: (memo: string) => void; // onSave prop 추가
}

export default function Modal({
  onClose,
  participantId,
  challengeId,
  serviceUserId,
  coach_memo,
  // memo_updated_at,
  onSave,
}: ModalProps) {
  const [coachMemo, setCoachMemo] = useState(coach_memo);
  // const [memoDate, setMemoDate] = useState<Date | null>(
  //   memo_updated_at || null
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
        coach_memo: coachMemo || "",
        // memo_updated_at: memoDate,
        serviceUserId: serviceUserId,
      });

      //console.log('coachMemo', coachMemo);

      if (onSave) {
        // console.log('coachMemo', coachMemo);
        onSave(coachMemo || "");
      }

      // 성공 시 페이지 새로고침
      router.refresh();
      onClose();
    } catch (err) {
// console.error("Error submitting coach memo:", err);
      alert("메모 저장 중 오류가 발생했습니다.");
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
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모바일: 하단 시트, 데스크톱: 중앙 모달 */}
      <div className="fixed z-50 sm:inset-x-0 sm:bottom-0 sm:top-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2">
        <div className="bg-white dark:bg-gray-800 shadow-xl sm:rounded-t-2xl sm:rounded-b-none lg:rounded-xl md:rounded-xl sm:w-full lg:w-[30rem] md:w-[28rem] sm:max-h-[90vh] sm:animate-slide-up lg:animate-none md:animate-none">
          {/* 모바일 드래그 핸들 */}
          <div className="sm:flex lg:hidden md:hidden justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>

          <div className="p-5 sm:p-4">
            {/* 헤더 */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">코치메모</h2>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-colors"
                aria-label="닫기"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 폼 */}
            <form onSubmit={handleSubmit}>
              <textarea
                value={coachMemo}
                onChange={handleMemoChange}
                className="w-full h-40 sm:h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-xl resize-none text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                placeholder="메모를 남겨주세요!"
                required
              />

              {/* 버튼 - 모바일에서 전체 너비, 터치 친화적 크기 */}
              <div className="flex gap-3 mt-5 sm:flex-col-reverse lg:flex-row md:flex-row">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-6 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500 rounded-xl font-medium transition-colors min-h-[48px]"
                >
                  닫기
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[48px]"
                >
                  {isLoading ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>

          {/* iOS Safe Area */}
          <div className="sm:h-[env(safe-area-inset-bottom)] lg:hidden md:hidden" />
        </div>
      </div>
    </>
  );
}
