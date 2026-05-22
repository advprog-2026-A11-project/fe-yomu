import { forwardRef, type TextareaHTMLAttributes } from "react";

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");

    const classes = [
      "yomu-input",
      "yomu-textarea",
      error ? "yomu-input-error" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="yomu-input-wrapper">
        {label && (
          <label htmlFor={textareaId} className="yomu-input-label">
            {label}
          </label>
        )}
        <textarea ref={ref} id={textareaId} className={classes} {...props} />
        {error && <span className="yomu-input-error-text">{error}</span>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
