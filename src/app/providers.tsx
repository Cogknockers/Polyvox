"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";

import UserThemeStyle from "@/components/app/user-theme-style";
import ThemePreferencesProvider from "@/components/theme-preferences-provider";
import { Toaster } from "@/components/ui/toaster";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <UserThemeStyle />
      <ThemePreferencesProvider />
      {children}
      <Toaster />
    </ThemeProvider>
  );
}
