import { spawnSync } from "node:child_process";
import type { AgentName, StoredSession } from "../core/types.js";
import { parseClaudeJsonUsage } from "../core/claude.js";
import { createSessionId, createUsageStore, inferAgent, projectFromCwd } from "../core/store.js";

export type RunCommandOptions = {
  cwd?: string;
  topic?: string;
  summary?: string;
  home?: string;
};

export function runAndRecord(command: string, args: string[], options: RunCommandOptions = {}): number {
  const cwd = options.cwd ?? process.cwd();
  const started = new Date();
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["inherit", "pipe", "pipe"],
  });
  const ended = new Date();

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  const agent = inferAgent(command);
  const usage = agent === "Claude" ? parseClaudeJsonUsage(result.stdout || "") : unknownUsage();
  const durationMinutes = Math.max(0, Math.round((ended.getTime() - started.getTime()) / 60000));
  const fullCommand = [command, ...args].join(" ");
  const session: StoredSession = {
    id: createSessionId(),
    startedAt: started.toISOString(),
    endedAt: ended.toISOString(),
    project: projectFromCwd(cwd),
    cwd,
    agent,
    command: fullCommand,
    topic: options.topic || inferTopic(args),
    summary: options.summary || usage.summary || fullCommand,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    totalTokens: usage.totalTokens,
    tokenBreakdown: usage.tokenBreakdown,
    costUsd: usage.costUsd,
    durationMinutes,
    tokenSource: usage.tokenSource,
    exitCode: result.status ?? 1,
  };

  createUsageStore(options.home).appendSession(session);
  return session.exitCode;
}

function unknownUsage() {
  return {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    tokenBreakdown: { inputTokens: 0, cacheCreationInputTokens: 0, cacheReadInputTokens: 0, outputTokens: 0, totalTokens: 0 },
    costUsd: 0,
    tokenSource: "unknown" as const,
    summary: undefined,
  };
}

function inferTopic(args: string[]): string {
  const promptFlagIndex = args.findIndex((arg) => arg === "-p" || arg === "--print");
  const candidate = promptFlagIndex >= 0 ? args[promptFlagIndex + 1] : args.find((arg) => !arg.startsWith("-"));
  if (!candidate) return "uncategorized";
  return candidate.replace(/\s+/g, " ").trim().slice(0, 40) || "uncategorized";
}
