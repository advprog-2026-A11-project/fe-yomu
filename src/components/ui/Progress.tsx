import { type HTMLAttributes } from "react";

type ProgressColor = "brand" | "success" | "warning" | "danger" | "gold";
type ProgressSize = "sm" | "md" | "lg";

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  color?: ProgressColor;
  size?: ProgressSize;
  showLabel?: boolean;
  label?: string;
}

export function Progress({
  value,
  max = 100,
  color = "brand",
  size = "md",
  showLabel = false,
  label,
  className = "",
  ...props
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={className} {...props}>
      {showLabel && (
        <div className="yomu-progress-label">
          <span>{label || `${Math.round(percentage)}%`}</span>
          <span>
            {value}/{max}
          </span>
        </div>
      )}
      <div className={`yomu-progress yomu-progress-${color} yomu-progress-${size}`}>
        <div
          className="yomu-progress-bar"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}
