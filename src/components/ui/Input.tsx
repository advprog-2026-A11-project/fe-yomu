import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  size?: "sm" | "md";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, size = "md", className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    const classes = [
      "yomu-input",
      `yomu-input-${size}`,
      leftIcon ? "yomu-input-icon" : "",
      error ? "yomu-input-error" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="yomu-input-wrapper">
        {label && (
          <label htmlFor={inputId} className="yomu-input-label">
            {label}
          </label>
        )}
        <div style={{ position: "relative" }}>
          {leftIcon && (
            <span
              style={{
                position: "absolute",
                left: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-soft)",
                display: "flex",
                alignItems: "center",
                pointerEvents: "none",
              }}
            >
              {leftIcon}
            </span>
          )}
          <input ref={ref} id={inputId} className={classes} {...props} />
        </div>
        {error && <span className="yomu-input-error-text">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
