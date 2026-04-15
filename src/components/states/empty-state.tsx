import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="state-card state-card-muted">
      <h2>{title}</h2>
      <p>{description}</p>
      {action ? <div className="state-card-action">{action}</div> : null}
    </div>
  );
}
