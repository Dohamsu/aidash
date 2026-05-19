import type { AgentName, StoredSession } from "../core/types.js";
import { createSessionId, createUsageStore, projectFromCwd } from "../core/store.js";

export type RecordCommandOptions = {
  agent: AgentName;
  project?: string;
  cwd?: string;
  tokens: string | number;
  inputTokens?: string | number;
  outputTokens?: string | number;
  cost?: string | number;
  topic?: string;
  summary?: string;
  command?: string;
  durationMinutes?: string | number;
  home?: string;
};

export function runRecordCommand(options: RecordCommandOptions): string {
  const cwd = options.cwd ?? process.cwd();
  const totalTokens = toNumber(options.tokens);
  const inputTokens = toNumber(options.inputTokens ?? 0);
  const outputTokens = toNumber(options.outputTokens ?? 0);
  const now = new Date().toISOString();
  const session: StoredSession = {
    id: createSessionId(),
    startedAt: now,
    endedAt: now,
    project: options.project || projectFromCwd(cwd),
    cwd,
    agent: options.agent,
    command: options.command || "manual record",
    topic: options.topic || "manual",
    summary: options.summary || options.topic || "Manual usage record",
    inputTokens,
    outputTokens,
    totalTokens,
    costUsd: toNumber(options.cost ?? 0),
    durationMinutes: toNumber(options.durationMinutes ?? 0),
    tokenSource: "manual",
    exitCode: 0,
  };

  createUsageStore(options.home).appendSession(session);
  return `Recorded ${totalTokens} tokens for ${session.project} (${session.agent})\n`;
}

function toNumber(value: string | number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Expected a number, got ${value}`);
  return parsed;
}
