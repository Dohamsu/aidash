import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { defaultClaudeHome, parseClaudeTranscript } from "./claude-transcript.js";
import { createUsageStore, filterSessionsForCwd, projectFromCwd, summarizeSessions } from "./store.js";
import type { StoredSession } from "./types.js";

export type ClaudeCurrentUsage = {
  session: StoredSession;
  transcriptPath: string;
  modifiedAt: string;
  ageSeconds: number;
  isActive: boolean;
  matchReason: "explicit" | "cwd" | "project" | "latest";
};

export type ClaudeCurrentUsageOptions = {
  claudeHome?: string;
  includeSubagents?: boolean;
  transcriptPath?: string;
  staleAfterSeconds?: number;
  now?: Date;
  cwd?: string;
  home?: string;
};

export type ClaudeCurrentSnapshotOptions = ClaudeCurrentUsageOptions & {
  home?: string;
};

export type ClaudeCurrentSnapshotResult = {
  snapshotPath: string;
  current: ClaudeCurrentUsage | null;
  writtenAt: string;
};

export function getClaudeCurrentUsage(options: ClaudeCurrentUsageOptions = {}): ClaudeCurrentUsage | null {
  const selected = options.transcriptPath
    ? { file: options.transcriptPath, matchReason: "explicit" as const }
    : selectTranscriptFile(options.claudeHome ?? defaultClaudeHome(), options.includeSubagents ?? false, options.cwd ?? process.cwd());
  if (!selected) return null;
  const file = selected.file;

  let stat: fs.Stats;
  let text: string;
  try {
    stat = fs.statSync(file);
    text = fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }

  const session = parseClaudeTranscript(text, file);
  if (!session) return null;

  const now = options.now ?? new Date();
  const ageSeconds = Math.max(0, Math.round((now.getTime() - stat.mtime.getTime()) / 1000));
  const staleAfterSeconds = options.staleAfterSeconds ?? 300;
  return {
    session,
    transcriptPath: file,
    modifiedAt: stat.mtime.toISOString(),
    ageSeconds,
    isActive: ageSeconds <= staleAfterSeconds,
    matchReason: selected.matchReason,
  };
}

export function writeClaudeCurrentSnapshot(options: ClaudeCurrentSnapshotOptions = {}): ClaudeCurrentSnapshotResult {
  const current = getClaudeCurrentUsage(options);
  const writtenAt = (options.now ?? new Date()).toISOString();
  const snapshotPath = path.join(options.home ?? path.join(os.homedir(), ".aidash"), "claude-current.json");
  const payload = { writtenAt, current };
  fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
  fs.writeFileSync(snapshotPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return { snapshotPath, current, writtenAt };
}

function selectTranscriptFile(claudeHome: string, includeSubagents: boolean, cwd: string): { file: string; matchReason: "cwd" | "project" | "latest" } | null {
  const candidates = transcriptCandidates(claudeHome, includeSubagents);
  if (candidates.length === 0) return null;
  const resolvedCwd = path.resolve(cwd);
  const project = projectFromCwd(resolvedCwd);
  const parsed = candidates.map((candidate) => {
    let session: StoredSession | null = null;
    try {
      session = parseClaudeTranscript(fs.readFileSync(candidate.file, "utf8"), candidate.file);
    } catch {
      session = null;
    }
    return { ...candidate, session };
  });
  const exact = parsed.filter((candidate) => candidate.session && path.resolve(candidate.session.cwd) === resolvedCwd).sort((a, b) => b.mtimeMs - a.mtimeMs)[0];
  if (exact) return { file: exact.file, matchReason: "cwd" };
  const projectMatch = parsed.filter((candidate) => candidate.session?.project === project).sort((a, b) => b.mtimeMs - a.mtimeMs)[0];
  if (projectMatch) return { file: projectMatch.file, matchReason: "project" };
  return { file: candidates[0].file, matchReason: "latest" };
}

function latestTranscriptFile(claudeHome: string, includeSubagents: boolean): string | null {
  return transcriptCandidates(claudeHome, includeSubagents)[0]?.file ?? null;
}

function transcriptCandidates(claudeHome: string, includeSubagents: boolean): Array<{ file: string; mtimeMs: number }> {
  const projectsDir = path.join(claudeHome, "projects");
  if (!fs.existsSync(projectsDir)) return [];

  const candidates: Array<{ file: string; mtimeMs: number }> = [];
  const visit = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!includeSubagents && entry.name === "subagents") continue;
        visit(full);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith(".jsonl") || entry.name === "skill-injections.jsonl") continue;
      let stat: fs.Stats;
      try {
        stat = fs.statSync(full);
      } catch {
        continue;
      }
      candidates.push({ file: full, mtimeMs: stat.mtimeMs });
    }
  };
  visit(projectsDir);
  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return candidates;
}
