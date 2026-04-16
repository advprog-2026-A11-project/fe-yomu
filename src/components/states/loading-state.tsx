export function LoadingState({
  title = "Loading your Yomu space",
  description = "We are pulling the latest account and module state for you.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="state-card">
      <div className="loading-orb" aria-hidden="true" />
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}
