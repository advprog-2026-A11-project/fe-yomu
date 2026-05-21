import { type HTMLAttributes, useMemo } from "react";

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
}: Readonly<SkeletonProps>) {
  const variantClass = `yomu-skeleton-${variant}`;
  const lineKeys = useMemo(
    () => Array.from({ length: lines }, () => globalThis.crypto.randomUUID()),
    [lines],
  );

  const inlineStyle: React.CSSProperties = {
    ...style,
    ...(width && { width: typeof width === "number" ? `${width}px` : width }),
    ...(height && { height: typeof height === "number" ? `${height}px` : height }),
  };

  if (variant === "text" && lines > 1) {
    return (
      <div className={className} style={inlineStyle}>
        {lineKeys.map((lineKey, i) => (
          <div
            key={lineKey}
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
