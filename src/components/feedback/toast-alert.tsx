"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Toast } from "@/components/ui/Toast";

export function ToastAlert() {
  const { toast, clearToast } = useAuth();

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => clearToast(), 4000);
    return () => window.clearTimeout(timer);
  }, [clearToast, toast]);

  if (!toast) return null;

  const typeMap: Record<string, "success" | "error" | "info"> = {
    success: "success",
    error: "error",
    neutral: "info",
  };

  return (
    <div className="yomu-toast-container">
      <Toast
        message={toast.message}
        type={typeMap[toast.tone] || "info"}
        onClose={clearToast}
      />
    </div>
  );
}
