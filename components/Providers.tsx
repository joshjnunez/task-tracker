"use client";

import React from "react";
import { AppDataProvider } from "@/components/AppDataProvider";
import { ToastProvider } from "@/components/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AppDataProvider>{children}</AppDataProvider>
    </ToastProvider>
  );
}
