import { type HTMLAttributes } from "react";

export type SkeletonVariant = "text" | "circle" | "rect";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  variant?: SkeletonVariant;
  lines?: number;
}

export function Skeleton({
  width,
  height,
  variant = "text",
  lines = 1,
  className = "",
  style,
  ...props
}: SkeletonProps) {
  const variantClass = `yomu-skeleton-${variant}`;

  const inlineStyle: React.CSSProperties = {
    ...style,
    ...(width && { width: typeof width === "number" ? `${width}px` : width }),
    ...(height && { height: typeof height === "number" ? `${height}px` : height }),
  };

  if (variant === "text" && lines > 1) {
    return (
      <div className={className} style={inlineStyle}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`yomu-skeleton yomu-skeleton-text ${i === lines - 1 && lines > 1 ? "yomu-skeleton-text:last-child" : ""}`}
            {...props}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`yomu-skeleton ${variantClass} ${className}`}
      style={inlineStyle}
      {...props}
    />
  );
}
