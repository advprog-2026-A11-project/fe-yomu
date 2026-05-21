import { type ReactNode } from "react";
import { Button, type ButtonProps } from "./Button";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: (ButtonProps & { label: string }) | ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = "" }: EmptyStateProps) {
  const isButtonProps = (val: ReactNode | (ButtonProps & { label: string })): val is ButtonProps & { label: string } => {
    return typeof val === "object" && val !== null && "label" in val;
  };

  return (
    <div className={`yomu-empty ${className}`}>
      {icon && <div className="yomu-empty-icon">{icon}</div>}
      <h3 className="yomu-empty-title">{title}</h3>
      {description && <p className="yomu-empty-description">{description}</p>}
      {action && (
        isButtonProps(action) ? (
          <Button variant={action.variant || "primary"} size={action.size || "md"} {...action}>
            {action.label}
          </Button>
        ) : (
          action
        )
      )}
    </div>
  );
}
