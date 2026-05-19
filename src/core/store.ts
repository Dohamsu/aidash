import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { AgentName, RecentSession, StoredSession, UsageBucket, UsageSummary } from "./types.js";

const STORE_FILE = "sessions.jsonl";

export type UsageStore = {
  dir: string;
  file: string;
  init(): void;
  appendSession(session: StoredSession): void;
  readSessions(): StoredSession[];
};

export function defaultAidashHome(): string {
  return process.env.AIDASH_HOME || path.join(os.homedir(), ".aidash");
}

export function createUsageStore(dir = defaultAidashHome()): UsageStore {
  const file = path.join(dir, STORE_FILE);
  return {
    dir,
    file,
    init() {
      fs.mkdirSync(dir, { recursive: true });
      if (!fs.existsSync(file)) fs.writeFileSync(file, "", "utf8");
    },
    appendSession(session: StoredSession) {
      this.init();
      fs.appendFileSync(file, `${JSON.stringify(session)}\n`, "utf8");
    },
    readSessions() {
      if (!fs.existsSync(file)) return [];
      return fs
        .readFileSync(file, "utf8")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => JSON.parse(line) as StoredSession);
    },
  };
}

export function projectFromCwd(cwd: string): string {
  const normalized = path.resolve(cwd);
  return path.basename(normalized) || "workspace";
}

export function summarizeSessions(sessions: StoredSession[], cwd = process.cwd(), rangeLabel = "All time"): UsageSummary {
  const project = projectFromCwd(cwd);
  const totalTokens = sessions.reduce((sum, session) => sum + session.totalTokens, 0);
  const totalCost = sessions.reduce((sum, session) => sum + session.costUsd, 0);

  return {
    generatedAt: new Date().toISOString(),
    rangeLabel,
    project,
    cwd: path.resolve(cwd),
    totals: {
      sessions: sessions.length,
      tokens: totalTokens,
      costUsd: roundMoney(totalCost),
    },
    byAgent: bucketsBy(sessions, (session) => session.agent, totalTokens),
    byTopic: bucketsBy(sessions, (session) => session.topic || "uncategorized", totalTokens),
    recentSessions: sessions
      .slice()
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .slice(0, 5)
      .map(toRecentSession),
  };
}

export function filterSessionsForCwd(sessions: StoredSession[], cwd: string): StoredSession[] {
  const project = projectFromCwd(cwd);
  return sessions.filter((session) => session.project === project || path.resolve(session.cwd) === path.resolve(cwd));
}

export function inferAgent(command: string): AgentName {
  const base = path.basename(command);
  if (base.includes("claude")) return "Claude";
  if (base.includes("codex")) return "Codex";
  if (base.includes("opencode")) return "OpenCode";
  return "Other";
}

export function createSessionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function bucketsBy(
  sessions: StoredSession[],
  key: (session: StoredSession) => string,
  totalTokens: number,
): UsageBucket[] {
  const map = new Map<string, { tokens: number; costUsd: number }>();
  for (const session of sessions) {
    const name = key(session);
    const current = map.get(name) ?? { tokens: 0, costUsd: 0 };
    current.tokens += session.totalTokens;
    current.costUsd += session.costUsd;
    map.set(name, current);
  }

  return Array.from(map.entries())
    .map(([name, value]) => ({
      name,
      tokens: value.tokens,
      costUsd: roundMoney(value.costUsd),
      percent: totalTokens === 0 ? 0 : value.tokens / totalTokens,
    }))
    .sort((a, b) => b.tokens - a.tokens);
}

function toRecentSession(session: StoredSession): RecentSession {
  const date = new Date(session.startedAt);
  const timeLabel = Number.isNaN(date.getTime())
    ? "--:--"
    : `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return {
    startedAt: session.startedAt,
    timeLabel,
    agent: session.agent,
    topic: session.topic,
    summary: session.summary,
    tokens: session.totalTokens,
    costUsd: session.costUsd,
    durationMinutes: session.durationMinutes,
  };
}

function roundMoney(value: number): number {
  return Math.round(value * 10000) / 10000;
}
