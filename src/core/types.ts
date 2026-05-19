export type AgentName = "Claude" | "Codex" | "OpenCode";

export type UsageBucket = {
  name: string;
  tokens: number;
  costUsd: number;
  percent: number;
};

export type RecentSession = {
  startedAt: string;
  timeLabel: string;
  agent: AgentName;
  topic: string;
  summary: string;
  tokens: number;
  costUsd: number;
  durationMinutes: number;
};

export type UsageSummary = {
  generatedAt: string;
  rangeLabel: string;
  project: string;
  cwd: string;
  totals: {
    sessions: number;
    tokens: number;
    costUsd: number;
  };
  byAgent: UsageBucket[];
  byTopic: UsageBucket[];
  recentSessions: RecentSession[];
};

export type RenderStyle = "dashboard" | "compact" | "plain";

export type RenderOptions = {
  style: RenderStyle;
  color: boolean;
  width: number;
};
