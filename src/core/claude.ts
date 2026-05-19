import type { TokenSource } from "../core/types.js";

export type CapturedUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
  tokenSource: TokenSource;
  summary?: string;
};

export function parseClaudeJsonUsage(stdout: string): CapturedUsage {
  const parsed = parseJsonObject(stdout);
  if (!parsed) {
    return { inputTokens: 0, outputTokens: 0, totalTokens: 0, costUsd: 0, tokenSource: "unknown" };
  }

  const usage = asRecord(parsed.usage);
  const modelUsage = asRecord(parsed.modelUsage);
  const inputTokens = numberAt(usage, "input_tokens") + numberAt(usage, "cache_creation_input_tokens") + numberAt(usage, "cache_read_input_tokens");
  const outputTokens = numberAt(usage, "output_tokens");
  const totalTokensFromUsage = inputTokens + outputTokens;
  const modelTotals = totalModelTokens(modelUsage);
  const totalTokens = totalTokensFromUsage || modelTotals.totalTokens;
  const costUsd = numberAt(parsed, "total_cost_usd") || modelTotals.costUsd;

  return {
    inputTokens,
    outputTokens,
    totalTokens,
    costUsd,
    tokenSource: totalTokens || costUsd ? "actual" : "unknown",
    summary: typeof parsed.result === "string" ? firstLine(parsed.result) : undefined,
  };
}

function parseJsonObject(stdout: string): Record<string, unknown> | null {
  const trimmed = stdout.trim();
  if (!trimmed) return null;
  const candidates = [trimmed, ...trimmed.split("\n").reverse()];
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    } catch {
      // Try next candidate.
    }
  }
  return null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function numberAt(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function totalModelTokens(modelUsage: Record<string, unknown>): { totalTokens: number; costUsd: number } {
  let totalTokens = 0;
  let costUsd = 0;
  for (const value of Object.values(modelUsage)) {
    const model = asRecord(value);
    totalTokens += numberAt(model, "inputTokens") + numberAt(model, "outputTokens");
    costUsd += numberAt(model, "costUSD");
  }
  return { totalTokens, costUsd };
}

function firstLine(value: string): string {
  return value.split("\n").map((line) => line.trim()).find(Boolean)?.slice(0, 100) || "Claude session";
}
