import './globals.css';
import React from 'react';
import { Metadata, Viewport } from 'next';
import ClientProviders from '@/components/providers/client-providers';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
};

export const metadata: Metadata = {
  title: 'Fitculator-admin',
  description: 'fitculator io',
  icons: {
    icon: '/image/logo-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scrollbar-hide" suppressHydrationWarning>
      <body className="font-pretendard">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
