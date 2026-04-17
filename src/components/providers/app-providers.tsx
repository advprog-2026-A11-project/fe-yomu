"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/components/providers/auth-provider";
import { AuthModal } from "@/components/auth/auth-modal";
import { ToastAlert } from "@/components/feedback/toast-alert";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <AuthModal />
      <ToastAlert />
    </AuthProvider>
  );
}
