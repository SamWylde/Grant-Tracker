"use client";

import type { ReactNode } from "react";

import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

import { appTheme } from "@/lib/theme";

type AppThemeProviderProps = {
  children: ReactNode;
};

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  return (
    <MantineProvider defaultColorScheme="dark" theme={appTheme}>
      <Notifications position="top-right" autoClose={4000} />
      {children}
    </MantineProvider>
  );
}
