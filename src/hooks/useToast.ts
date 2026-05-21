import { useState, useCallback, useRef, useEffect } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
  duration: number;
}

interface UseToastOptions {
  defaultDuration?: number;
  maxToasts?: number;
}

export function useToast({ defaultDuration = 4000, maxToasts = 5 }: UseToastOptions = {}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (message: string, options?: { type?: ToastType; title?: string; duration?: number }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const duration = options?.duration ?? defaultDuration;

      setToasts((prev) => {
        const next = [...prev, { id, message, type: options?.type ?? "info", title: options?.title, duration }];
        return next.length > maxToasts ? next.slice(next.length - maxToasts) : next;
      });

      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [defaultDuration, maxToasts, dismiss]
  );

  const success = useCallback((message: string, options?: { title?: string; duration?: number }) => {
    return addToast(message, { type: "success", ...options });
  }, [addToast]);

  const error = useCallback((message: string, options?: { title?: string; duration?: number }) => {
    return addToast(message, { type: "error", ...options });
  }, [addToast]);

  const warning = useCallback((message: string, options?: { title?: string; duration?: number }) => {
    return addToast(message, { type: "warning", ...options });
  }, [addToast]);

  const info = useCallback((message: string, options?: { title?: string; duration?: number }) => {
    return addToast(message, { type: "info", ...options });
  }, [addToast]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return {
    toasts,
    dismiss,
    success,
    error,
    warning,
    info,
  };
}
