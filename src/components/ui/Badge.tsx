import { type HTMLAttributes, type ReactNode } from "react";

export type BadgeVariant = "default" | "brand" | "success" | "warning" | "danger" | "info";
export type BadgeSize = "sm" | "md" | "lg";
export type TierType = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
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
}: Readonly<BadgeProps>) {
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
