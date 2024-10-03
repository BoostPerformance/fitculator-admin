import localFont from 'next/font/local';
import './globals.css';
import React from 'react';
import Head from 'next/head';
import Footer from '@/components/footer';
import { ThemeProvider } from 'next-themes';

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
      <ThemeProvider enableSystem={true} attribute="class">
        <body className={`${pretendard.variable} font-pretendard`}>
          {children}
          <Footer />
        </body>
      </ThemeProvider>
    </html>
  );
}
