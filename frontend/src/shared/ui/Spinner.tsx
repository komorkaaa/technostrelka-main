export function Spinner({ label }: { label?: string }) {
  return (
    <div className="spinnerWrap" role="status" aria-live="polite">
      <div className="spinner" />
      <div className="muted">{label ?? "Loading"}</div>
    </div>
  );
}

