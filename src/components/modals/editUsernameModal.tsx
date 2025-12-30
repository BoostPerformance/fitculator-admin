'use client';
import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

interface EditUsernameModalProps {
  isOpen: boolean;
  currentUsername: string;
  onClose: () => void;
  onSave: (newUsername: string) => Promise<void>;
}

const EditUsernameModal: React.FC<EditUsernameModalProps> = ({
  isOpen,
  currentUsername,
  onClose,
  onSave,
}) => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // 모달이 열릴 때마다 현재 username으로 초기화
  useEffect(() => {
    if (isOpen) {
      setUsername(currentUsername);
      setError('');
    }
  }, [isOpen, currentUsername]);

  // 변경사항이 있는지 확인
  const hasChanges = username.trim() !== currentUsername;

  const handleSave = async () => {
    if (!username.trim()) {
      setError('이름을 입력해주세요');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onSave(username.trim());
      onClose();
    } catch (err) {
      setError('이름 수정에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmClose(false);
    setUsername(currentUsername);
    setError('');
    onClose();
  };

  const handleCancelClose = () => {
    setShowConfirmClose(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* 모바일: 하단 시트, 데스크톱: 중앙 모달 */}
      <div className="fixed z-50 sm:inset-x-0 sm:bottom-0 sm:top-auto lg:inset-0 lg:flex lg:items-center lg:justify-center md:inset-0 md:flex md:items-center md:justify-center">
        <div className="bg-white dark:bg-gray-800 shadow-xl sm:rounded-t-2xl sm:rounded-b-none lg:rounded-xl md:rounded-xl sm:w-full lg:w-96 md:w-96 lg:max-w-[90vw] md:max-w-[90vw] sm:max-h-[90vh] sm:animate-slide-up lg:animate-fade-in md:animate-fade-in">
          {/* 모바일 드래그 핸들 */}
          <div className="sm:flex lg:hidden md:hidden justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>

          <div className="p-5 sm:p-4">
            {/* 헤더 */}
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">이름 수정</h2>
              <button
                onClick={handleClose}
                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-colors"
                aria-label="닫기"
              >
                <FaTimes size={18} />
              </button>
            </div>

            {/* 입력 필드 */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                이름
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all min-h-[48px]"
                placeholder="이름을 입력하세요"
                maxLength={50}
                disabled={isLoading}
              />
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
            </div>

            {/* 버튼 - 모바일에서 전체 너비, 터치 친화적 크기 */}
            <div className="flex gap-3 sm:flex-col-reverse lg:flex-row md:flex-row">
              <button
                onClick={handleClose}
                className="flex-1 py-3 px-6 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500 rounded-xl font-medium transition-colors min-h-[48px]"
                disabled={isLoading}
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading || !hasChanges || !username.trim()}
                className={`flex-1 py-3 px-6 rounded-xl font-medium transition-colors min-h-[48px] ${
                  hasChanges && username.trim() && !isLoading
                    ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>

          {/* iOS Safe Area */}
          <div className="sm:h-[env(safe-area-inset-bottom)] lg:hidden md:hidden" />
        </div>
      </div>

      {/* 확인 모달 */}
      {showConfirmClose && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={handleCancelClose}
          />
          <div className="fixed z-[60] sm:inset-x-0 sm:bottom-0 sm:top-auto lg:inset-0 lg:flex lg:items-center lg:justify-center md:inset-0 md:flex md:items-center md:justify-center">
            <div className="bg-white dark:bg-gray-800 shadow-xl sm:rounded-t-2xl sm:rounded-b-none lg:rounded-xl md:rounded-xl sm:w-full lg:w-80 md:w-80 lg:max-w-[90vw] md:max-w-[90vw] p-5 sm:p-4 sm:animate-slide-up lg:animate-fade-in md:animate-fade-in">
              {/* 모바일 드래그 핸들 */}
              <div className="sm:flex lg:hidden md:hidden justify-center pb-2 -mt-1">
                <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                변경사항이 있습니다
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-5">
                저장하지 않은 변경사항이 있습니다. 정말 닫으시겠습니까?
              </p>
              <div className="flex gap-3 sm:flex-col-reverse lg:flex-row md:flex-row">
                <button
                  onClick={handleCancelClose}
                  className="flex-1 py-3 px-4 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500 transition-colors min-h-[48px]"
                >
                  계속 수정
                </button>
                <button
                  onClick={handleConfirmClose}
                  className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 active:bg-red-700 transition-colors min-h-[48px]"
                >
                  닫기
                </button>
              </div>

              {/* iOS Safe Area */}
              <div className="sm:h-[env(safe-area-inset-bottom)] lg:hidden md:hidden" />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default EditUsernameModal;