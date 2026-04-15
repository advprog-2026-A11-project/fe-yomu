"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";

export function ToastAlert() {
  const { toast, clearToast } = useAuth();

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => clearToast(), 3200);
    return () => window.clearTimeout(timer);
  }, [clearToast, toast]);

  if (!toast) {
    return null;
  }

  return (
    <div className={`toast toast-${toast.tone}`} role="status" aria-live="polite">
      {toast.message}
    </div>
  );
}
