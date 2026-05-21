import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parseClaudeTranscript, scanClaudeHistory } from "../src/core/claude-transcript.js";

function line(value: unknown): string {
  return `${JSON.stringify(value)}\n`;
}

describe("Claude transcript import", () => {
  const homes: string[] = [];

  afterEach(() => {
    for (const home of homes.splice(0)) rmSync(home, { recursive: true, force: true });
  });

  it("aggregates assistant usage from a Claude transcript into one stored session", () => {
    const transcript = [
      line({ type: "queue-operation", timestamp: "2026-05-20T09:00:00.000Z", sessionId: "s-1" }),
      line({ type: "user", timestamp: "2026-05-20T09:00:01.000Z", sessionId: "s-1", cwd: "/Users/dohamsu/Workspace/graymar", message: { role: "user", content: "Fix combat loop" } }),
      line({ type: "assistant", timestamp: "2026-05-20T09:00:05.000Z", sessionId: "s-1", cwd: "/Users/dohamsu/Workspace/graymar", message: { role: "assistant", content: [{ type: "text", text: "Done" }], usage: { input_tokens: 100, cache_creation_input_tokens: 20, cache_read_input_tokens: 30, output_tokens: 40 } } }),
      line({ type: "assistant", timestamp: "2026-05-20T09:03:05.000Z", sessionId: "s-1", cwd: "/Users/dohamsu/Workspace/graymar", message: { role: "assistant", usage: { input_tokens: 10, output_tokens: 5 } } }),
    ].join("");

    const session = parseClaudeTranscript(transcript, "/Users/dohamsu/.claude/projects/-Users-dohamsu-Workspace-graymar/s-1.jsonl");

    expect(session).not.toBeNull();
    if (!session) throw new Error("expected transcript to parse");

    expect(session).toMatchObject({
      id: "claude:s-1",
      project: "graymar",
      cwd: "/Users/dohamsu/Workspace/graymar",
      agent: "Claude",
      command: "claude transcript import",
      topic: "Fix combat loop",
      inputTokens: 160,
      outputTokens: 45,
      totalTokens: 205,
      tokenBreakdown: {
        inputTokens: 110,
        cacheCreationInputTokens: 20,
        cacheReadInputTokens: 30,
        outputTokens: 45,
        totalTokens: 205,
      },
      costUsd: 0,
      tokenSource: "actual",
      exitCode: 0,
    });
    expect(session.durationMinutes).toBe(3);
  });

  it("deduplicates repeated Claude assistant message snapshots by message id", () => {
    const repeatedAssistant = {
      type: "assistant",
      timestamp: "2026-05-20T09:00:05.000Z",
      sessionId: "s-dedupe",
      cwd: "/Users/dohamsu/Workspace/graymar",
      message: {
        id: "msg_1",
        role: "assistant",
        usage: { input_tokens: 10, cache_creation_input_tokens: 20, cache_read_input_tokens: 30, output_tokens: 40 },
      },
    };
    const transcript = [
      line({ type: "user", timestamp: "2026-05-20T09:00:00.000Z", sessionId: "s-dedupe", cwd: "/Users/dohamsu/Workspace/graymar", message: { role: "user", content: "Check duplicates" } }),
      line(repeatedAssistant),
      line({ ...repeatedAssistant, timestamp: "2026-05-20T09:00:06.000Z" }),
    ].join("");

    const session = parseClaudeTranscript(transcript, "/Users/dohamsu/.claude/projects/-Users-dohamsu-Workspace-graymar/s-dedupe.jsonl");

    expect(session?.tokenBreakdown).toMatchObject({
      inputTokens: 10,
      cacheCreationInputTokens: 20,
      cacheReadInputTokens: 30,
      outputTokens: 40,
      totalTokens: 100,
    });
  });

  it("scans Claude history and skips sessions already imported", () => {
    const root = mkdtempSync(path.join(tmpdir(), "claude-history-"));
    homes.push(root);
    const projectDir = path.join(root, "projects", "-Users-dohamsu-Workspace-graymar");
    mkdirSync(projectDir, { recursive: true });
    const transcriptPath = path.join(projectDir, "s-2.jsonl");
    writeFileSync(
      transcriptPath,
      line({ type: "user", timestamp: "2026-05-20T09:00:00.000Z", sessionId: "s-2", cwd: "/Users/dohamsu/Workspace/graymar", message: { role: "user", content: "Review UI" } }) +
        line({ type: "assistant", timestamp: "2026-05-20T09:01:00.000Z", sessionId: "s-2", cwd: "/Users/dohamsu/Workspace/graymar", message: { role: "assistant", usage: { input_tokens: 1, output_tokens: 2 } } }),
      "utf8",
    );

    const result = scanClaudeHistory({ claudeHome: root, existingIds: new Set(["claude:other"]) });
    const skipped = scanClaudeHistory({ claudeHome: root, existingIds: new Set(["claude:s-2"]) });

    expect(result.sessions.map((session) => session.id)).toEqual(["claude:s-2"]);
    expect(result.skippedExisting).toBe(0);
    expect(skipped.sessions).toHaveLength(0);
    expect(skipped.skippedExisting).toBe(1);
  });
});
