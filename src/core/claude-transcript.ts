import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { StoredSession } from "./types.js";
import { projectFromCwd } from "./store.js";

export type ClaudeHistoryScanOptions = {
  claudeHome?: string;
  existingIds?: Set<string>;
  includeSubagents?: boolean;
  since?: Date;
  transcriptPath?: string;
};

export type ClaudeHistoryScanResult = {
  sessions: StoredSession[];
  scannedFiles: number;
  skippedExisting: number;
  skippedEmpty: number;
};

type TranscriptRecord = Record<string, unknown>;

export function defaultClaudeHome(): string {
  return path.join(os.homedir(), ".claude");
}

export function parseClaudeTranscript(text: string, transcriptPath = "claude-session.jsonl"): StoredSession | null {
  let sessionId = path.basename(transcriptPath, ".jsonl");
  let cwd = cwdFromProjectPath(transcriptPath) ?? process.cwd();
  let startedAt: string | undefined;
  let endedAt: string | undefined;
  let firstPrompt = "claude session";
  let summary = "Claude session";
  let inputTokens = 0;
  let cacheCreationInputTokens = 0;
  let cacheReadInputTokens = 0;
  let outputTokens = 0;
  let sawUsage = false;
  const countedMessageIds = new Set<string>();

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    let record: TranscriptRecord;
    try {
      record = JSON.parse(line) as TranscriptRecord;
    } catch {
      continue;
    }

    const currentSessionId = stringAt(record, "sessionId");
    if (currentSessionId) sessionId = currentSessionId;
    const currentCwd = stringAt(record, "cwd");
    if (currentCwd) cwd = currentCwd;
    const timestamp = stringAt(record, "timestamp");
    if (timestamp) {
      startedAt ??= timestamp;
      endedAt = timestamp;
    }

    const message = asRecord(record.message);
    const role = stringAt(message, "role");
    if (role === "user" && firstPrompt === "claude session") {
      firstPrompt = extractText(message.content) || stringAt(record, "lastPrompt") || "claude session";
    }
    if (role === "assistant") {
      const textSummary = extractText(message.content);
      if (textSummary && summary === "Claude session") summary = textSummary;
      const usage = asRecord(message.usage);
      const messageId = stringAt(message, "id") || stringAt(record, "uuid");
      if (messageId && countedMessageIds.has(messageId)) continue;
      const input = numberAt(usage, "input_tokens");
      const cacheCreation = numberAt(usage, "cache_creation_input_tokens");
      const cacheRead = numberAt(usage, "cache_read_input_tokens");
      const output = numberAt(usage, "output_tokens");
      if (input || cacheCreation || cacheRead || output) {
        if (messageId) countedMessageIds.add(messageId);
        inputTokens += input;
        cacheCreationInputTokens += cacheCreation;
        cacheReadInputTokens += cacheRead;
        outputTokens += output;
        sawUsage = true;
      }
    }
  }

  if (!sawUsage) return null;
  const start = startedAt ?? new Date(0).toISOString();
  const end = endedAt ?? start;
  const totalTokens = inputTokens + cacheCreationInputTokens + cacheReadInputTokens + outputTokens;

  return {
    id: `claude:${sessionId}`,
    startedAt: start,
    endedAt: end,
    project: projectFromCwd(cwd),
    cwd,
    agent: "Claude",
    command: "claude transcript import",
    topic: firstLine(firstPrompt, 40),
    summary: firstLine(summary, 100),
    inputTokens: inputTokens + cacheCreationInputTokens + cacheReadInputTokens,
    outputTokens,
    totalTokens,
    tokenBreakdown: {
      inputTokens,
      cacheCreationInputTokens,
      cacheReadInputTokens,
      outputTokens,
      totalTokens,
    },
    costUsd: 0,
    durationMinutes: durationMinutes(start, end),
    tokenSource: "actual",
    exitCode: 0,
  };
}

export function scanClaudeHistory(options: ClaudeHistoryScanOptions = {}): ClaudeHistoryScanResult {
  const existingIds = options.existingIds ?? new Set<string>();
  const files = options.transcriptPath ? [options.transcriptPath] : listTranscriptFiles(options.claudeHome ?? defaultClaudeHome(), options.includeSubagents ?? false);
  const sessions: StoredSession[] = [];
  let skippedExisting = 0;
  let skippedEmpty = 0;

  for (const file of files) {
    const id = `claude:${path.basename(file, ".jsonl")}`;
    if (existingIds.has(id)) {
      skippedExisting += 1;
      continue;
    }
    let text = "";
    try {
      text = fs.readFileSync(file, "utf8");
    } catch {
      skippedEmpty += 1;
      continue;
    }
    const session = parseClaudeTranscript(text, file);
    if (!session) {
      skippedEmpty += 1;
      continue;
    }
    if (options.since && new Date(session.startedAt) < options.since) continue;
    sessions.push(session);
  }

  sessions.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  return { sessions, scannedFiles: files.length, skippedExisting, skippedEmpty };
}

function listTranscriptFiles(claudeHome: string, includeSubagents: boolean): string[] {
  const projectsDir = path.join(claudeHome, "projects");
  if (!fs.existsSync(projectsDir)) return [];
  const results: string[] = [];
  const visit = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!includeSubagents && entry.name === "subagents") continue;
        visit(full);
      } else if (entry.isFile() && entry.name.endsWith(".jsonl") && entry.name !== "skill-injections.jsonl") {
        results.push(full);
      }
    }
  };
  visit(projectsDir);
  return results;
}

function cwdFromProjectPath(file: string): string | null {
  const parts = file.split(path.sep);
  const projectsIndex = parts.lastIndexOf("projects");
  const encoded = projectsIndex >= 0 ? parts[projectsIndex + 1] : undefined;
  if (!encoded?.startsWith("-")) return null;
  return encoded.replace(/-/g, path.sep);
}

function extractText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        const record = asRecord(item);
        return stringAt(record, "text");
      })
      .filter(Boolean)
      .join(" ");
  }
  return "";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringAt(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function numberAt(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function firstLine(value: string, max: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max) || "claude session";
}

function durationMinutes(start: string, end: string): number {
  const started = new Date(start).getTime();
  const ended = new Date(end).getTime();
  if (!Number.isFinite(started) || !Number.isFinite(ended)) return 0;
  return Math.max(0, Math.round((ended - started) / 60000));
}
