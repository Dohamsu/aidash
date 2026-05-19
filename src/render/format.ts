export function formatPercent(value: number): string {
  return `${Math.round(clamp(value) * 100)}%`;
}

export function formatTokens(tokens: number): string {
  const abs = Math.abs(tokens);
  if (abs >= 1_000_000) return `${trimFixed(tokens / 1_000_000)}m`;
  if (abs >= 1_000) return `${trimFixed(tokens / 1_000)}k`;
  return String(tokens);
}

export function formatCost(costUsd: number): string {
  return `$${costUsd.toFixed(2)}`;
}

export function clamp(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function trimFixed(value: number): string {
  const fixed = value.toFixed(1);
  return fixed.endsWith(".0") ? fixed.slice(0, -2) : fixed;
}
