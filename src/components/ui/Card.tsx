import { type HTMLAttributes, type ReactNode } from "react";

export type CardVariant = "default" | "raised" | "pressed";
export type CardPadding = "sm" | "md" | "lg" | "none";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
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
}: Readonly<CardProps>) {
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
