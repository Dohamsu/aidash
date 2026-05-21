import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runImportClaudeHistoryCommand, runImportClaudeSessionCommand } from "../src/commands/import-claude-history.js";
import { createUsageStore } from "../src/core/store.js";

function line(value: unknown): string {
  return `${JSON.stringify(value)}\n`;
}

describe("import claude history command", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  function fixture() {
    const home = mkdtempSync(path.join(tmpdir(), "aidash-home-"));
    const claudeHome = mkdtempSync(path.join(tmpdir(), "claude-home-"));
    dirs.push(home, claudeHome);
    const projectDir = path.join(claudeHome, "projects", "-Users-dohamsu-Workspace-graymar");
    mkdirSync(projectDir, { recursive: true });
    writeFileSync(
      path.join(projectDir, "s-3.jsonl"),
      line({ type: "user", timestamp: "2026-05-20T09:00:00.000Z", sessionId: "s-3", cwd: "/Users/dohamsu/Workspace/graymar", message: { role: "user", content: "Fix UI" } }) +
        line({ type: "assistant", timestamp: "2026-05-20T09:02:00.000Z", sessionId: "s-3", cwd: "/Users/dohamsu/Workspace/graymar", message: { role: "assistant", usage: { input_tokens: 10, output_tokens: 5 } } }),
      "utf8",
    );
    return { home, claudeHome };
  }

  it("dry-runs without writing sessions", () => {
    const { home, claudeHome } = fixture();

    const output = runImportClaudeHistoryCommand({ home, claudeHome, dryRun: true });

    expect(output).toContain("Dry run");
    expect(output).toContain("importable: 1");
    expect(createUsageStore(home).readSessions()).toHaveLength(0);
  });

  it("imports sessions and is idempotent", () => {
    const { home, claudeHome } = fixture();

    const output = runImportClaudeHistoryCommand({ home, claudeHome });
    const second = runImportClaudeHistoryCommand({ home, claudeHome });

    expect(output).toContain("Imported 1 Claude session");
    expect(second).toContain("importable: 0");
    expect(second).toContain("skipped existing: 1");
    expect(createUsageStore(home).readSessions()).toHaveLength(1);
  });

  it("skips transcript import when an equivalent wrapper-captured session already exists", () => {
    const { home, claudeHome } = fixture();
    createUsageStore(home).appendSession({
      id: "wrapper-session",
      startedAt: "2026-05-20T09:00:30.000Z",
      endedAt: "2026-05-20T09:02:30.000Z",
      project: "graymar",
      cwd: "/Users/dohamsu/Workspace/graymar",
      agent: "Claude",
      command: "claude -p Fix UI --output-format json",
      topic: "Fix UI",
      summary: "Fix UI",
      inputTokens: 10,
      outputTokens: 5,
      totalTokens: 15,
      tokenBreakdown: { inputTokens: 10, cacheCreationInputTokens: 0, cacheReadInputTokens: 0, outputTokens: 5, totalTokens: 15 },
      costUsd: 0.01,
      durationMinutes: 2,
      tokenSource: "actual",
      exitCode: 0,
    });

    const output = runImportClaudeHistoryCommand({ home, claudeHome });

    expect(output).toContain("importable: 0");
    expect(output).toContain("skipped existing: 1");
    expect(createUsageStore(home).readSessions()).toHaveLength(1);
  });

  it("imports one Claude session from hook stdin JSON", () => {
    const { home, claudeHome } = fixture();
    const transcript = path.join(claudeHome, "projects", "-Users-dohamsu-Workspace-graymar", "s-3.jsonl");

    const output = runImportClaudeSessionCommand({ home }, JSON.stringify({ transcript_path: transcript }));

    expect(output).toContain("Imported 1 Claude session");
    expect(createUsageStore(home).readSessions()).toHaveLength(1);
  });
});
