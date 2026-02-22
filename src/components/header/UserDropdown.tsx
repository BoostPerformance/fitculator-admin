'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import LogoutButton from '@/components/buttons/logoutButton';
import EditUsernameModal from '@/components/modals/editUsernameModal';
import { useAdminData } from '@/components/hooks/useAdminData';

interface UserDropdownProps {
  showEditUsername?: boolean;
}

export function UserDropdown({ showEditUsername = false }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editUsernameModal, setEditUsernameModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { adminData, displayUsername, isLoading, hasData, fetchAdminData } = useAdminData();

  const { data: coachIdentity } = useQuery({
    queryKey: ['coach-identity'],
    queryFn: async () => {
      const res = await fetch('/api/coach-identity');
      if (!res.ok) return null;
      const json = await res.json();
      return json.data as { userId: string; coachId: string; name: string; profileImageUrl: string | null } | null;
    },
    staleTime: Infinity,
  });

  const handleUsernameUpdate = async (newUsername: string) => {
    const response = await fetch('/api/admin-users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newUsername }),
    });
    if (!response.ok) throw new Error('Failed to update username');
    await fetchAdminData();
  };

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, handleClickOutside]);

  const profileImageUrl = coachIdentity?.profileImageUrl;

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return '좋은 아침이에요';
    if (hour >= 12 && hour < 18) return '안녕하세요';
    if (hour >= 18 && hour < 22) return '오늘도 수고 많았어요';
    return '늦은 시간이네요';
  })();

  return (
    <>
      <div ref={dropdownRef} className="relative flex items-center gap-2">
        <div className={`text-content-secondary text-body whitespace-nowrap ${isLoading ? 'animate-pulse' : ''}`}>
          {greeting}, {displayUsername}!
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-surface-raised transition-colors"
          aria-label="사용자 메뉴"
          aria-expanded={isOpen}
        >
          {profileImageUrl ? (
            <img src={profileImageUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white text-label font-semibold">
              {(displayUsername || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="text-content-secondary transition-transform duration-300 ease-in-out"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 bg-surface border border-line rounded-md shadow-elevation-2 overflow-hidden z-50 min-w-[120px] animate-in fade-in-0 zoom-in-95">
            {showEditUsername && (
              <>
                <button
                  onClick={() => {
                    setEditUsernameModal(true);
                    setIsOpen(false);
                  }}
                  disabled={isLoading || !hasData}
                  className="relative flex w-full cursor-pointer select-none items-center px-3 py-2 text-body outline-none transition-colors hover:bg-surface-raised text-content-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이름 수정
                </button>
                <div className="border-t border-line" />
              </>
            )}
            <LogoutButton />
          </div>
        )}
      </div>

      {showEditUsername && (
        <EditUsernameModal
          isOpen={editUsernameModal}
          currentUsername={adminData?.username || ''}
          onClose={() => setEditUsernameModal(false)}
          onSave={handleUsernameUpdate}
        />
      )}
    </>
  );
}
