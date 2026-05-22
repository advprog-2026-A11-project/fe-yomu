import { type HTMLAttributes } from "react";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

export interface AvatarProps extends Omit<HTMLAttributes<HTMLDivElement>, "src"> {
  name?: string;
  src?: string;
  size?: AvatarSize;
  fallback?: string;
}

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "?";
  return (parts[0][0] + parts.at(-1)![0]).toUpperCase();
}

export function Avatar({ name, src, size = "md", fallback, className = "", ...props }: Readonly<AvatarProps>) {
  const classes = [
    "yomu-avatar",
    `yomu-avatar-${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const initials = getInitials(name || fallback || "");

  return (
    <div className={classes} {...props}>
      {src ? (
        <img src={src} alt={name || "Avatar"} />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
