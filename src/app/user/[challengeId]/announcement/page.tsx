// app/(user)/[challengeId]/announcement/page.tsx
'use client';

import { useState } from 'react';
import NoticeModal from '@/components/input/noticeModal';
import { useParams } from 'next/navigation';

export default function AnnouncementPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<string | null>(null);
  const [notices, setNotices] = useState([
    { id: '1', title: '첫 번째 공지사항입니다', content: '내용입니다 1' },
    { id: '2', title: '두 번째 공지사항입니다', content: '내용입니다 2' },
    { id: '3', title: '세 번째 공지사항입니다', content: '내용입니다 3' },
  ]);
  const params = useParams();
  const challengeId = params?.challengeId as string;

  const handleOpenModal = (id?: string) => {
    setSelectedNotice(id || null);
    setModalOpen(true);
  };

  const handleSaveNotice = (updatedNotice: {
    id?: string;
    title: string;
    content: string;
  }) => {
    if (updatedNotice.id) {
      setNotices((prev) =>
        prev.map((n) =>
          n.id === updatedNotice.id ? { ...n, ...updatedNotice } : n
        )
      );
    } else {
      const newId = String(notices.length + 1);
      setNotices((prev) => [...prev, { ...updatedNotice, id: newId }]);
    }
    setModalOpen(false);
    setSelectedNotice(null);
  };

  const selectedNoticeData =
    notices.find((n) => n.id === selectedNotice) || null;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">공지사항</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          + 새 공지 추가
        </button>
      </div>
      <ul className="space-y-4">
        {notices.map((notice) => (
          <li
            key={notice.id}
            onClick={() => handleOpenModal(notice.id)}
            className="p-4 border rounded cursor-pointer hover:bg-gray-100"
          >
            {notice.title}
          </li>
        ))}
      </ul>

      {modalOpen && (
        <NoticeModal
          onClose={() => {
            setModalOpen(false);
            setSelectedNotice(null);
          }}
          challengeId={challengeId}
          noticeId={selectedNotice}
          defaultTitle={selectedNoticeData?.title || ''}
          defaultContent={selectedNoticeData?.content || ''}
          onSave={handleSaveNotice}
        />
      )}
    </div>
  );
}
