import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "success" | "gold";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  pill?: boolean;
  iconOnly?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      pill = false,
      iconOnly = false,
      loading = false,
      leftIcon,
      rightIcon,
      className = "",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const classes = [
      "yomu-btn",
      `yomu-btn-${variant}`,
      `yomu-btn-${size}`,
      pill ? "yomu-btn-pill" : "",
      iconOnly ? "yomu-btn-icon" : "",
      loading ? "yomu-btn-loading" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {leftIcon && !loading && <span className="yomu-btn-icon-wrap">{leftIcon}</span>}
        {children}
        {rightIcon && !loading && <span className="yomu-btn-icon-wrap">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
