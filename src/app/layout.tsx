import './globals.css';
import React from 'react';
import { Metadata, Viewport } from 'next';
import ClientProviders from '@/components/providers/client-providers';
import Footer from '@/components/layout/footer';

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
      <head>
        <link
          rel="preload"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
          as="style"
          onLoad="this.onload=null;this.rel='stylesheet'"
        />
        <link rel="preload" href="/image/logo-icon.png" as="image" />
        <link rel="dns-prefetch" href="//lh3.googleusercontent.com" />
        <noscript>
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
          />
        </noscript>
      </head>
      <body className="font-pretendard">
        <ClientProviders>
          {children}
          <Footer />
        </ClientProviders>
      </body>
    </html>
  );
}
