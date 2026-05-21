import { type ReactNode, useEffect } from "react";

export type ModalSize = "sm" | "md" | "lg" | "xl";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  size?: ModalSize;
  children: ReactNode;
  footer?: ReactNode;
  showCloseButton?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  size = "md",
  children,
  footer,
  showCloseButton = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="yomu-modal-backdrop"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <div
        className={`yomu-modal yomu-modal-${size}`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="document"
      >
        {(title || showCloseButton) && (
          <div className="yomu-modal-header">
            {title && <h2 className="yomu-modal-title">{title}</h2>}
            {showCloseButton && (
              <button
                type="button"
                className="yomu-modal-close"
                onClick={onClose}
                aria-label="Close modal"
              >
                ×
              </button>
            )}
          </div>
        )}
        <div className="yomu-modal-body">{children}</div>
        {footer && <div className="yomu-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
