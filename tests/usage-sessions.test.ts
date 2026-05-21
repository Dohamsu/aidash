import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runUsageCommand } from "../src/commands/usage.js";
import { createUsageStore } from "../src/core/store.js";
import type { StoredSession } from "../src/core/types.js";

function sample(overrides: Partial<StoredSession> = {}): StoredSession {
  const totalTokens = overrides.totalTokens ?? 1000;
  return {
    id: overrides.id ?? "s1",
    startedAt: overrides.startedAt ?? "2026-05-19T10:00:00.000Z",
    endedAt: overrides.endedAt ?? "2026-05-19T10:05:00.000Z",
    project: overrides.project ?? "graymar",
    cwd: overrides.cwd ?? "/work/graymar",
    agent: overrides.agent ?? "Claude",
    command: overrides.command ?? "claude -p hello --output-format json",
    topic: overrides.topic ?? "implementation",
    summary: overrides.summary ?? "Implemented feature",
    inputTokens: overrides.inputTokens ?? Math.max(0, totalTokens - 100),
    outputTokens: overrides.outputTokens ?? 100,
    totalTokens,
    tokenBreakdown: overrides.tokenBreakdown ?? {
      inputTokens: Math.max(0, totalTokens - 100),
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: 0,
      outputTokens: 100,
      totalTokens,
    },
    costUsd: overrides.costUsd ?? 0.01,
    durationMinutes: overrides.durationMinutes ?? 5,
    tokenSource: overrides.tokenSource ?? "actual",
    exitCode: overrides.exitCode ?? 0,
  };
}

describe("usage session list", () => {
  const homes: string[] = [];

  afterEach(() => {
    for (const home of homes.splice(0)) rmSync(home, { recursive: true, force: true });
  });

  it("renders every stored session with a token share progress bar", () => {
    const home = mkdtempSync(path.join(tmpdir(), "aidash-sessions-"));
    homes.push(home);
    const store = createUsageStore(home);
    store.appendSession(sample({ id: "s1", startedAt: "2026-05-19T09:00:00.000Z", topic: "small", totalTokens: 1000, costUsd: 0.01 }));
    store.appendSession(sample({ id: "s2", startedAt: "2026-05-19T10:00:00.000Z", topic: "medium", totalTokens: 2000, costUsd: 0.02 }));
    store.appendSession(sample({ id: "s3", startedAt: "2026-05-19T11:00:00.000Z", topic: "large", totalTokens: 3000, costUsd: 0.03 }));

    const output = runUsageCommand({ home, cwd: "/work/graymar", sessions: true, color: false });

    expect(output).toContain("AIDash sessions - All time - graymar");
    expect(output).toContain("Total: 6k tokens across 3 sessions");
    expect(output).toContain("large");
    expect(output).toContain("3k tokens");
    expect(output).toContain("██████░░░░░░ 50%");
    expect(output).toContain("medium");
    expect(output).toContain("████░░░░░░░░ 33%");
    expect(output).toContain("small");
    expect(output).toContain("██░░░░░░░░░░ 17%");
  });
});
