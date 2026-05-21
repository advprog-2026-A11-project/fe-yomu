import { type HTMLAttributes, type ReactNode } from "react";

type BadgeVariant = "default" | "brand" | "success" | "warning" | "danger" | "info";
type BadgeSize = "sm" | "md" | "lg";
type TierType = "bronze" | "silver" | "gold" | "platinum" | "diamond";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  tier?: TierType;
  size?: BadgeSize;
  children: ReactNode;
}

export function Badge({
  variant = "default",
  tier,
  size = "md",
  className = "",
  children,
  ...props
}: BadgeProps) {
  const tierClass = tier ? `yomu-tier-${tier}` : "";
  const variantClass = tier ? "" : `yomu-badge-${variant}`;

  const classes = [
    "yomu-badge",
    `yomu-badge-${size}`,
    variantClass,
    tierClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}
