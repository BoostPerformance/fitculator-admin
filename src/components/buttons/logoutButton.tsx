'use client';

import { signOut } from 'next-auth/react';

export default function LogoutButton() {
  return (
    <button
      type="button"
      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm"
      onClick={() => {
        signOut({ callbackUrl: '/' });
      }}
    >
      로그아웃
    </button>
  );
}
