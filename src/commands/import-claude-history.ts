import { scanClaudeHistory } from "../core/claude-transcript.js";
import { createUsageStore } from "../core/store.js";
import type { StoredSession } from "../core/types.js";

export type ImportClaudeHistoryOptions = {
  home?: string;
  claudeHome?: string;
  dryRun?: boolean;
  includeSubagents?: boolean;
  since?: string;
  transcript?: string;
};

export function runImportClaudeHistoryCommand(options: ImportClaudeHistoryOptions): string {
  const store = createUsageStore(options.home);
  const existingSessions = store.readSessions();
  const existingIds = new Set(existingSessions.map((session) => session.id));
  const since = options.since ? new Date(options.since) : undefined;
  if (since && Number.isNaN(since.getTime())) throw new Error("--since must be a valid date");

  const result = scanClaudeHistory({
    claudeHome: options.claudeHome,
    existingIds,
    includeSubagents: options.includeSubagents,
    since,
    transcriptPath: options.transcript,
  });

  const importableSessions = result.sessions.filter((session) => !hasEquivalentSession(existingSessions, session));
  const skippedEquivalent = result.sessions.length - importableSessions.length;
  const dedupedResult = { ...result, sessions: importableSessions, skippedExisting: result.skippedExisting + skippedEquivalent };

  if (!options.dryRun) {
    for (const session of dedupedResult.sessions) store.appendSession(session);
  }

  return formatSummary(options, dedupedResult);
}

export function runImportClaudeSessionCommand(options: ImportClaudeHistoryOptions, stdin = ""): string {
  const transcript = options.transcript || process.env.CLAUDE_TRANSCRIPT_PATH || transcriptFromHookInput(stdin);
  if (!transcript) return "No Claude transcript path found in --transcript, CLAUDE_TRANSCRIPT_PATH, or hook stdin\n";
  return runImportClaudeHistoryCommand({ ...options, transcript });
}

function hasEquivalentSession(existingSessions: StoredSession[], candidate: StoredSession): boolean {
  return existingSessions.some((existing) => {
    if (existing.agent !== candidate.agent) return false;
    if (existing.project !== candidate.project && existing.cwd !== candidate.cwd) return false;
    if (existing.totalTokens !== candidate.totalTokens) return false;
    const deltaMs = Math.abs(new Date(existing.startedAt).getTime() - new Date(candidate.startedAt).getTime());
    return Number.isFinite(deltaMs) && deltaMs <= 2 * 60 * 1000;
  });
}

function transcriptFromHookInput(stdin: string): string | undefined {
  if (!stdin.trim()) return undefined;
  try {
    const parsed = JSON.parse(stdin) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
    const record = parsed as Record<string, unknown>;
    const snake = record.transcript_path;
    const camel = record.transcriptPath;
    return typeof snake === "string" ? snake : typeof camel === "string" ? camel : undefined;
  } catch {
    return undefined;
  }
}

function formatSummary(
  options: ImportClaudeHistoryOptions,
  result: { sessions: { totalTokens: number }[]; scannedFiles: number; skippedExisting: number; skippedEmpty: number },
): string {
  const lines = [
    `${options.dryRun ? "Dry run" : "Import complete"}: scanned ${result.scannedFiles} Claude transcript file(s), importable: ${result.sessions.length}, skipped existing: ${result.skippedExisting}, skipped empty: ${result.skippedEmpty}`,
  ];
  const totalTokens = result.sessions.reduce((sum, session) => sum + session.totalTokens, 0);
  if (options.dryRun) {
    lines.push(`Would import ${result.sessions.length} Claude session(s), ${totalTokens} tokens`);
  } else {
    lines.push(`Imported ${result.sessions.length} Claude session(s), ${totalTokens} tokens`);
  }
  return `${lines.join("\n")}\n`;
}
