import { type ReactNode } from "react";

export type LoadingVariant = "orb" | "dots";

export interface LoadingStateProps {
  variant?: LoadingVariant;
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingState({ variant = "orb", message, size = "md", className = "" }: LoadingStateProps) {
  const sizeMap: Record<"sm" | "md" | "lg", string> = {
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
  };

  return (
    <div className={`yomu-loading ${className}`}>
      {variant === "orb" ? (
        <div className="yomu-loading-orb" />
      ) : (
        <div className="yomu-loading-dots">
          <span style={{ width: sizeMap[size], height: sizeMap[size] }} />
          <span style={{ width: sizeMap[size], height: sizeMap[size] }} />
          <span style={{ width: sizeMap[size], height: sizeMap[size] }} />
        </div>
      )}
      {message && <span className="yomu-loading-text">{message}</span>}
    </div>
  );
}
