import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { getClaudeCurrentUsage } from "../src/core/claude-current.js";
import { createUsageStore } from "../src/core/store.js";
import { runClaudeCurrentCommand } from "../src/commands/claude-current.js";

function line(value: unknown): string {
  return `${JSON.stringify(value)}\n`;
}

describe("Claude current usage", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  function fixture() {
    const claudeHome = mkdtempSync(path.join(tmpdir(), "claude-home-"));
    dirs.push(claudeHome);
    const projectDir = path.join(claudeHome, "projects", "-Users-dohamsu-Workspace-graymar");
    mkdirSync(projectDir, { recursive: true });
    const oldTranscript = path.join(projectDir, "old.jsonl");
    writeFileSync(
      oldTranscript,
      line({ type: "user", timestamp: "2026-05-20T09:00:00.000Z", sessionId: "old", cwd: "/Users/dohamsu/Workspace/graymar", message: { role: "user", content: "old" } }) +
        line({ type: "assistant", timestamp: "2026-05-20T09:01:00.000Z", sessionId: "old", cwd: "/Users/dohamsu/Workspace/graymar", message: { role: "assistant", id: "m-old", usage: { input_tokens: 1, output_tokens: 1 } } }),
      "utf8",
    );
    const currentTranscript = path.join(projectDir, "current.jsonl");
    writeFileSync(
      currentTranscript,
      line({ type: "user", timestamp: "2026-05-21T09:00:00.000Z", sessionId: "current", cwd: "/Users/dohamsu/Workspace/graymar", message: { role: "user", content: "Fix current bug" } }) +
        line({ type: "assistant", timestamp: "2026-05-21T09:02:00.000Z", sessionId: "current", cwd: "/Users/dohamsu/Workspace/graymar", message: { role: "assistant", id: "m-1", content: "Working", usage: { input_tokens: 10, cache_creation_input_tokens: 20, cache_read_input_tokens: 30, output_tokens: 40 } } }) +
        line({ type: "assistant", timestamp: "2026-05-21T09:03:00.000Z", sessionId: "current", cwd: "/Users/dohamsu/Workspace/graymar", message: { role: "assistant", id: "m-1", content: "Working", usage: { input_tokens: 10, cache_creation_input_tokens: 20, cache_read_input_tokens: 30, output_tokens: 40 } } }) +
        "{partial-json",
      "utf8",
    );
    const now = new Date("2026-05-21T09:04:00.000Z");
    utimesSync(oldTranscript, new Date("2026-05-20T09:01:00.000Z"), new Date("2026-05-20T09:01:00.000Z"));
    utimesSync(currentTranscript, now, now);
    return { claudeHome, currentTranscript, now };
  }

  it("parses the most recently modified transcript as current usage", () => {
    const { claudeHome, currentTranscript, now } = fixture();

    const current = getClaudeCurrentUsage({ claudeHome, now, staleAfterSeconds: 3600 });

    expect(current?.transcriptPath).toBe(currentTranscript);
    expect(current?.isActive).toBe(true);
    expect(current?.session.tokenBreakdown).toMatchObject({
      inputTokens: 10,
      cacheCreationInputTokens: 20,
      cacheReadInputTokens: 30,
      outputTokens: 40,
      totalTokens: 100,
    });
  });

  it("renders a concise current usage report", () => {
    const { claudeHome, now } = fixture();

    const output = runClaudeCurrentCommand({ claudeHome, now, staleAfterSeconds: 3600, color: false });

    expect(output).toContain("Claude current session");
    expect(output).toContain("Status: active");
    expect(output).toContain("Total: 100");
    expect(output).toContain("Cache read: 30");
  });

  it("renders compact /au output with the designed filled Unicode progress bar and project/all totals", () => {
    const { claudeHome, now } = fixture();
    const home = mkdtempSync(path.join(tmpdir(), "aidash-home-"));
    dirs.push(home);
    const store = createUsageStore(home);
    store.appendSession({
      id: "stored-1",
      startedAt: "2026-05-21T08:00:00.000Z",
      endedAt: "2026-05-21T08:05:00.000Z",
      project: "graymar",
      cwd: "/Users/dohamsu/Workspace/graymar",
      agent: "Claude",
      command: "claude",
      topic: "graymar task",
      summary: "graymar task",
      inputTokens: 700,
      outputTokens: 300,
      totalTokens: 1000,
      tokenBreakdown: { inputTokens: 700, cacheCreationInputTokens: 0, cacheReadInputTokens: 0, outputTokens: 300, totalTokens: 1000 },
      costUsd: 0.12,
      durationMinutes: 5,
      tokenSource: "actual",
      exitCode: 0,
    });
    store.appendSession({
      id: "stored-2",
      startedAt: "2026-05-21T08:10:00.000Z",
      endedAt: "2026-05-21T08:12:00.000Z",
      project: "other",
      cwd: "/tmp/other",
      agent: "Claude",
      command: "claude",
      topic: "other task",
      summary: "other task",
      inputTokens: 2000,
      outputTokens: 0,
      totalTokens: 2000,
      tokenBreakdown: { inputTokens: 2000, cacheCreationInputTokens: 0, cacheReadInputTokens: 0, outputTokens: 0, totalTokens: 2000 },
      costUsd: 0.2,
      durationMinutes: 2,
      tokenSource: "actual",
      exitCode: 0,
    });

    const output = runClaudeCurrentCommand({ claudeHome, home, cwd: "/Users/dohamsu/Workspace/graymar", now, staleAfterSeconds: 3600, compact: true, budgetTokens: 200 });

    expect(output).toContain("AIDash /au");
    expect(output).toContain("Current: 100 tokens, active 00:00:00 ago");
    expect(output).toContain("█████░░░░░ 50%");
    expect(output).toContain("Project graymar: 1k tokens, $0.12 est");
    expect(output).toContain("All projects: 3k tokens, $0.32 est");
    expect(output).toContain("Source: Claude transcript (cwd, updated 00:00:00 ago)");
  });

  it("prefers a transcript matching the current working directory over a newer unrelated transcript", () => {
    const { claudeHome, currentTranscript, now } = fixture();
    const otherDir = path.join(claudeHome, "projects", "-tmp-other");
    mkdirSync(otherDir, { recursive: true });
    const otherTranscript = path.join(otherDir, "newer.jsonl");
    writeFileSync(
      otherTranscript,
      line({ type: "user", timestamp: "2026-05-21T09:05:00.000Z", sessionId: "other", cwd: "/tmp/other", message: { role: "user", content: "other" } }) +
        line({ type: "assistant", timestamp: "2026-05-21T09:06:00.000Z", sessionId: "other", cwd: "/tmp/other", message: { role: "assistant", id: "m-other", usage: { input_tokens: 999, output_tokens: 1 } } }),
      "utf8",
    );
    utimesSync(otherTranscript, new Date("2026-05-21T09:05:00.000Z"), new Date("2026-05-21T09:05:00.000Z"));

    const current = getClaudeCurrentUsage({ claudeHome, cwd: "/Users/dohamsu/Workspace/graymar", now, staleAfterSeconds: 3600 });

    expect(current?.transcriptPath).toBe(currentTranscript);
    expect(current?.matchReason).toBe("cwd");
  });
});
