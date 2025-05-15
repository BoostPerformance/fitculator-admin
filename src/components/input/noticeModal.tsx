'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface NoticeModalProps {
  onClose: () => void;
  challengeId: string;
  noticeId?: string | null;
  defaultTitle?: string;
  defaultContent?: string;
  onSave: (notice: { id?: string; title: string; content: string }) => void;
}

export default function NoticeModal({
  onClose,
  challengeId,
  noticeId,
  defaultTitle = '',
  defaultContent = '',
  onSave,
}: NoticeModalProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [content, setContent] = useState(defaultContent);

  useEffect(() => {
    setTitle(defaultTitle);
    setContent(defaultContent);
  }, [defaultTitle, defaultContent]);

  const handleSubmit = () => {
    onSave({
      id: noticeId ?? undefined,
      title,
      content,
    });
  };

  const isEditMode = !!noticeId;

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
        >
          ✕
        </button>
        <h2 className="text-lg font-bold mb-4">
          {isEditMode ? '공지사항 수정하기' : '공지사항 생성하기'}
        </h2>
        <input
          className="w-full border border-gray-300 rounded p-2 mb-4"
          placeholder="공지사항 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full h-40 border border-gray-300 rounded p-2"
          placeholder="공지사항 내용을 입력하세요..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
            onClick={onClose}
          >
            취소
          </button>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={handleSubmit}
          >
            {isEditMode ? '수정하기' : '등록하기'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
