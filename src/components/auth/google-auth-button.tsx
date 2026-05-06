"use client";

type GoogleAuthButtonProps = {
  loading: boolean;
  label: string;
  onClick: () => void;
};

export function GoogleAuthButton({
  loading,
  label,
  onClick,
}: GoogleAuthButtonProps) {
  return (
    <button
      type="button"
      className="button button-secondary button-with-icon"
      disabled={loading}
      onClick={onClick}
    >
      <span className="button-icon">G</span>
      {label}
    </button>
  );
}
