interface InteractionCountValueProps {
  value?: number;
  loading: boolean;
}

export default function InteractionCountValue({
  value,
  loading,
}: InteractionCountValueProps) {
  if (loading) {
    return (
      <span
        aria-hidden="true"
        className="inline-block h-3 min-w-4 rounded bg-muted animate-pulse"
      />
    );
  }

  return (
    <span className="inline-flex min-w-4 justify-end tabular-nums">
      {value ?? 0}
    </span>
  );
}
