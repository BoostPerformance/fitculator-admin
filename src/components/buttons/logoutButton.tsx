'use client';

import { signOut } from 'next-auth/react';
import { memo } from 'react';

const LogoutButton = memo(() => {
 return (
 <button
 type="button"
 className="relative flex w-full cursor-pointer select-none items-center px-3 py-2 text-body outline-none transition-colors hover:bg-surface-raised focus:bg-surface-raised dark:focus:bg-neutral-700 text-content-primary"
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
