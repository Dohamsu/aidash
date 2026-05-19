import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createUsageStore, summarizeSessions } from "../src/core/store.js";
import type { StoredSession } from "../src/core/types.js";

function tempHome() {
  return mkdtempSync(path.join(tmpdir(), "aidash-test-"));
}

function sample(overrides: Partial<StoredSession> = {}): StoredSession {
  return {
    id: "s1",
    startedAt: "2026-05-19T10:00:00.000Z",
    endedAt: "2026-05-19T10:05:00.000Z",
    project: "graymar",
    cwd: "/work/graymar",
    agent: "Claude",
    command: "claude -p hello --output-format json",
    topic: "implementation",
    summary: "Implemented feature",
    inputTokens: 1000,
    outputTokens: 500,
    totalTokens: 1500,
    costUsd: 0.04,
    durationMinutes: 5,
    tokenSource: "actual",
    exitCode: 0,
    ...overrides,
  };
}

describe("usage store", () => {
  const homes: string[] = [];

  afterEach(() => {
    for (const home of homes.splice(0)) rmSync(home, { recursive: true, force: true });
  });

  it("initializes, appends, and reads local usage sessions", () => {
    const home = tempHome();
    homes.push(home);
    const store = createUsageStore(home);

    store.init();
    store.appendSession(sample());

    expect(store.readSessions()).toHaveLength(1);
    expect(store.readSessions()[0]).toMatchObject({ project: "graymar", totalTokens: 1500, costUsd: 0.04 });
  });

  it("summarizes stored sessions by agent and topic", () => {
    const sessions = [
      sample({ id: "s1", agent: "Claude", topic: "bugfix", totalTokens: 1000, costUsd: 0.02 }),
      sample({ id: "s2", agent: "Codex", topic: "bugfix", totalTokens: 500, costUsd: 0.01 }),
      sample({ id: "s3", agent: "Claude", topic: "docs", totalTokens: 500, costUsd: 0.01 }),
    ];

    const summary = summarizeSessions(sessions, "/work/graymar", "Today");

    expect(summary.totals).toMatchObject({ sessions: 3, tokens: 2000, costUsd: 0.04 });
    expect(summary.byAgent[0]).toMatchObject({ name: "Claude", tokens: 1500, percent: 0.75 });
    expect(summary.byTopic[0]).toMatchObject({ name: "bugfix", tokens: 1500, percent: 0.75 });
  });
});
