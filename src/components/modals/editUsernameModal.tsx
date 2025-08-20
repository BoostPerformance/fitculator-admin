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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">이름 수정</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes size={20} />
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이름
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="이름을 입력하세요"
              maxLength={50}
              disabled={isLoading}
            />
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={isLoading}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || !hasChanges || !username.trim()}
              className={`px-4 py-2 rounded-md ${
                hasChanges && username.trim() && !isLoading
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>

      {/* 확인 모달 */}
      {showConfirmClose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 w-80 max-w-[90vw]">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              변경사항이 있습니다
            </h3>
            <p className="text-gray-600 mb-4">
              저장하지 않은 변경사항이 있습니다. 정말 닫으시겠습니까?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelClose}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                계속 수정
              </button>
              <button
                onClick={handleConfirmClose}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditUsernameModal;