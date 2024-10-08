import localFont from 'next/font/local';
import './globals.css';
import React from 'react';
import Head from 'next/head';
import Footer from '@/components/layout/footer';
import { ThemeProvider } from 'next-themes';
import SessionProviderWrapper from '@/components/auth/sessionProviderWrapper';

const pretendard = localFont({
  src: '../fonts/PretendardVariable.woff2',
  display: 'swap',
  weight: '45 920',
  variable: '--font-pretendard',
});

export const metadata = {
  title: 'Fitculator-admin',
  description: 'fitculator io',
  icons: {
    icon: '/images/logo-favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scrollbar-hide" suppressHydrationWarning>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <body className={`${pretendard.variable} font-pretendard`}>
        <SessionProviderWrapper>
          <ThemeProvider enableSystem={true} attribute="class">
            {children}
            <Footer />
          </ThemeProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
