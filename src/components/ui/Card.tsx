import { type HTMLAttributes, type ReactNode } from "react";

type CardVariant = "default" | "raised" | "pressed";
type CardPadding = "sm" | "md" | "lg" | "none";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  hoverable?: boolean;
  children: ReactNode;
}

export function Card({
  variant = "default",
  padding = "md",
  hoverable = false,
  className = "",
  children,
  ...props
}: CardProps) {
  const classes = [
    "yomu-card",
    `yomu-card-${variant}`,
    `yomu-card-padding-${padding}`,
    hoverable ? "yomu-card-hover" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
