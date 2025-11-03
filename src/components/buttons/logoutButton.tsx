'use client';

import { signOut } from 'next-auth/react';
import { memo } from 'react';

const LogoutButton = memo(() => {
  return (
    <button
      type="button"
      className="relative flex w-full cursor-pointer select-none items-center px-3 py-2 text-sm outline-none transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 text-gray-900 dark:text-gray-100"
      onClick={() => {
        signOut({ callbackUrl: '/' });
      }}
      role="menuitem"
      aria-label="로그아웃"
    >
      로그아웃
    </button>
  );
});

LogoutButton.displayName = 'LogoutButton';

export default LogoutButton;
