import path from "node:path";
import type { RecentSession, UsageBucket, UsageSummary } from "./types.js";

function withPercent<T extends Omit<UsageBucket, "percent">>(items: T[], total: number): UsageBucket[] {
  return items.map((item) => ({
    ...item,
    percent: total === 0 ? 0 : item.tokens / total,
  }));
}

function projectFromCwd(cwd: string): string {
  const normalized = path.resolve(cwd);
  return path.basename(normalized) || "workspace";
}

export function getDemoUsageSummary(cwd = process.cwd()): UsageSummary {
  const totalTokens = 184_200;
  const recentSessions: RecentSession[] = [
    {
      startedAt: "2026-05-19T14:10:00+09:00",
      timeLabel: "14:10",
      agent: "Claude",
      topic: "combat loop bugfix",
      summary: "Fixed combat loop bugfix",
      tokens: 51_240,
      costUsd: 0.26,
      durationMinutes: 38,
    },
    {
      startedAt: "2026-05-19T12:30:00+09:00",
      timeLabel: "12:30",
      agent: "Codex",
      topic: "UI cleanup",
      summary: "Tightened CLI dashboard layout",
      tokens: 23_040,
      costUsd: 0.11,
      durationMinutes: 18,
    },
    {
      startedAt: "2026-05-19T10:15:00+09:00",
      timeLabel: "10:15",
      agent: "Claude",
      topic: "browser playtest",
      summary: "Verified playtest flow",
      tokens: 62_100,
      costUsd: 0.31,
      durationMinutes: 44,
    },
  ];

  return {
    generatedAt: "2026-05-19T17:00:00+09:00",
    rangeLabel: "Today",
    project: projectFromCwd(cwd),
    cwd: path.resolve(cwd),
    totals: {
      sessions: 7,
      tokens: totalTokens,
      costUsd: 0.92,
    },
    byAgent: withPercent(
      [
        { name: "Claude", tokens: 142_100, costUsd: 0.71 },
        { name: "Codex", tokens: 42_100, costUsd: 0.21 },
      ],
      totalTokens,
    ),
    byTopic: withPercent(
      [
        { name: "bugfix", tokens: 73_400, costUsd: 0.37 },
        { name: "playtest", tokens: 41_200, costUsd: 0.21 },
        { name: "refactor", tokens: 39_900, costUsd: 0.2 },
        { name: "docs", tokens: 29_700, costUsd: 0.14 },
      ],
      totalTokens,
    ),
    recentSessions,
  };
}
