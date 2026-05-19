export type AgentName = "Claude" | "Codex" | "OpenCode" | "Other";

export type TokenSource = "actual" | "estimated" | "unknown" | "manual";

export type StoredSession = {
  id: string;
  startedAt: string;
  endedAt: string;
  project: string;
  cwd: string;
  agent: AgentName;
  command: string;
  topic: string;
  summary: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
  durationMinutes: number;
  tokenSource: TokenSource;
  exitCode: number;
};

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
