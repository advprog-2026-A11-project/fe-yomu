import { type ReactNode } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: ReactNode;
  type?: ToastType;
  title?: string;
  onClose?: () => void;
  duration?: number;
}

const icons: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};

export function Toast({ message, type = "info", title, onClose, duration }: ToastProps) {
  return (
    <div className={`yomu-toast yomu-toast-${type}`} role="alert">
      <span className="yomu-toast-icon">{icons[type]}</span>
      <div className="yomu-toast-content">
        {title && <div className="yomu-toast-title">{title}</div>}
        <div className="yomu-toast-message">{message}</div>
      </div>
      {onClose && (
        <button
          type="button"
          className="yomu-toast-close"
          onClick={onClose}
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
}

interface ToastItem {
  id: string;
  message: ReactNode;
  type?: ToastType;
  title?: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="yomu-toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          title={toast.title}
          onClose={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  );
}
