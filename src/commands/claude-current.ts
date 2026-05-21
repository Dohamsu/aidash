import { getClaudeCurrentUsage, type ClaudeCurrentUsageOptions, writeClaudeCurrentSnapshot } from "../core/claude-current.js";
import { createUsageStore, filterSessionsForCwd, summarizeSessions } from "../core/store.js";
import { formatTokens } from "../render/format.js";
import { renderBar } from "../render/bar.js";

export type ClaudeCurrentCommandOptions = ClaudeCurrentUsageOptions & {
  json?: boolean;
  color?: boolean;
  home?: string;
  cwd?: string;
  compact?: boolean;
  budgetTokens?: number;
};

export function runClaudeCurrentCommand(options: ClaudeCurrentCommandOptions = {}): string {
  const current = getClaudeCurrentUsage(options);
  if (!current) {
    const message = "No Claude transcript with usage found. Run Claude Code first or pass --transcript <path>.";
    return options.json ? `${JSON.stringify({ current: null, message }, null, 2)}\n` : `${message}\n`;
  }

  if (options.json) return `${JSON.stringify(current, null, 2)}\n`;
  if (options.compact) return renderCompactCurrent(current, options);

  const b = current.session.tokenBreakdown;
  const status = current.isActive ? "active" : "stale";
  return [
    `Claude current session`,
    `Status: ${status} (${current.ageSeconds}s since transcript update)`,
    `Project: ${current.session.project}`,
    `Topic: ${current.session.topic}`,
    `Transcript: ${current.transcriptPath}`,
    `Started: ${current.session.startedAt}`,
    `Last event: ${current.session.endedAt}`,
    `Duration: ${current.session.durationMinutes}m`,
    ``,
    `Input: ${formatTokens(b.inputTokens)}`,
    `Cache creation: ${formatTokens(b.cacheCreationInputTokens)}`,
    `Cache read: ${formatTokens(b.cacheReadInputTokens)}`,
    `Output: ${formatTokens(b.outputTokens)}`,
    `Total: ${formatTokens(b.totalTokens)}`,
  ].join("\n") + "\n";
}

function renderCompactCurrent(current: NonNullable<ReturnType<typeof getClaudeCurrentUsage>>, options: ClaudeCurrentCommandOptions): string {
  const b = current.session.tokenBreakdown;
  const status = current.isActive ? "active" : "stale";
  const budget = Math.max(1, options.budgetTokens ?? 200_000);
  const cwd = options.cwd ?? current.session.cwd;
  const sessions = createUsageStore(options.home).readSessions();
  const projectSummary = summarizeSessions(filterSessionsForCwd(sessions, cwd), cwd);
  const allSummary = summarizeSessions(sessions, cwd);
  const age = formatDurationClock(current.ageSeconds);
  return [
    "AIDash /au",
    `Current: ${formatTokens(b.totalTokens)} tokens, ${status} ${age} ago`,
    `Progress: ${progressBar(b.totalTokens, budget)}`,
    `Project ${projectSummary.project}: ${formatTokens(projectSummary.totals.tokens)} tokens, $${projectSummary.totals.costUsd.toFixed(2)} est`,
    `All projects: ${formatTokens(allSummary.totals.tokens)} tokens, $${allSummary.totals.costUsd.toFixed(2)} est`,
    `Source: Claude transcript (${current.matchReason}, updated ${age} ago)`,
  ].join("\n") + "\n";
}

function progressBar(value: number, max: number, width = 10): string {
  const percent = Math.max(0, Math.min(1, value / max));
  return `${renderBar(percent, width, false)} ${Math.round(percent * 100)}%`;
}

function formatDurationClock(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

export function runClaudeCurrentDaemonOnce(options: ClaudeCurrentCommandOptions = {}): string {
  const result = writeClaudeCurrentSnapshot(options);
  const total = result.current?.session.tokenBreakdown.totalTokens ?? 0;
  return `Wrote Claude current snapshot to ${result.snapshotPath} (${formatTokens(total)} tokens)\n`;
}

export function runClaudeCurrentDaemon(options: ClaudeCurrentCommandOptions & { intervalSeconds?: number } = {}): void {
  const intervalMs = Math.max(1, options.intervalSeconds ?? 5) * 1000;
  const tick = () => {
    const message = runClaudeCurrentDaemonOnce(options);
    process.stdout.write(`${new Date().toISOString()} ${message}`);
  };
  tick();
  setInterval(tick, intervalMs);
}

export function watchClaudeCurrent(options: ClaudeCurrentCommandOptions & { intervalSeconds?: number } = {}): void {
  const intervalMs = Math.max(1, options.intervalSeconds ?? 2) * 1000;
  const render = () => {
    process.stdout.write("\x1Bc");
    process.stdout.write(runClaudeCurrentCommand(options));
    process.stdout.write(`\nRefreshing every ${intervalMs / 1000}s. Press Ctrl+C to stop.\n`);
  };
  render();
  setInterval(render, intervalMs);
}
