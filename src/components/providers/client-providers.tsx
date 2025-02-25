"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import RootProvider from "./root-provider";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <ThemeProvider enableSystem={true} attribute="class">
        <RootProvider>{children}</RootProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
