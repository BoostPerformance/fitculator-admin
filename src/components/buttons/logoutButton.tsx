'use client';

import { signOut } from 'next-auth/react';

export default function LogoutButton() {
  return (
    <button
      type="button"
      className="py-1.5  text-gray-10  hover:bg-gray-3  "
      onClick={() => {
        signOut({ callbackUrl: '/' });
      }}
    >
      로그아웃
    </button>
  );
}
