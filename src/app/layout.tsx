import localFont from "next/font/local";
import "./globals.css";
import React from "react";
import RootProvider from "@/components/providers/root-provider";
import { Metadata, Viewport } from "next";

const pretendard = localFont({
  src: "../fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
};

export const metadata: Metadata = {
  title: "Fitculator-admin",
  description: "fitculator io",
  icons: {
    icon: "/image/logo-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scrollbar-hide" suppressHydrationWarning>
      <body className={`${pretendard.variable} font-pretendard`}>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
