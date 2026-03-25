interface ConfidenceBarProps {
  score: number;
}

function scoreColor(score: number): string {
  if (score >= 0.9) return "var(--color-success)";
  if (score >= 0.7) return "var(--color-warning)";
  return "var(--color-danger)";
}

export function ConfidenceBar({ score }: ConfidenceBarProps) {
  const pct = Math.round(score * 100);
  return (
    <span title={`${pct}% confidence`}>
      <span className="confidence-bar">
        <span
          className="confidence-fill"
          style={{ width: `${pct}%`, background: scoreColor(score) }}
        />
      </span>
      {pct}%
    </span>
  );
}
