import { type ReactNode } from "react";

type TabSize = "sm" | "md" | "lg";

interface TabItem {
  id: string;
  label: ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  size?: TabSize;
  className?: string;
}

export function Tabs({ items, active, onChange, size = "md", className = "" }: TabsProps) {
  const sizeClass = `yomu-tab-${size}`;

  return (
    <div className={`yomu-tabs ${className}`} role="tablist">
      {items.map((item) => (
        <button
          key={item.id}
          role="tab"
          aria-selected={active === item.id}
          aria-disabled={item.disabled}
          className={`${sizeClass} yomu-tab${active === item.id ? " yomu-tab-active" : ""}`}
          onClick={() => !item.disabled && onChange(item.id)}
          disabled={item.disabled}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
