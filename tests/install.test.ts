import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { installClaudeCurrentAgent, installClaudeUsageSlashCommand, installClaudeUsageSlashCommands, installShellAlias, uninstallShellAlias, upsertClaudeStopHook, installClaudeCodePackage } from "../src/core/install.js";

describe("install helpers", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  function tempFile(name: string) {
    const dir = mkdtempSync(path.join(tmpdir(), "aidash-install-"));
    dirs.push(dir);
    return path.join(dir, name);
  }

  it("installs and uninstalls the shell alias block idempotently", () => {
    const zshrc = tempFile(".zshrc");
    writeFileSync(zshrc, "export PATH=/tmp:$PATH\n", "utf8");

    const first = installShellAlias({ zshrc });
    const second = installShellAlias({ zshrc });
    const removed = uninstallShellAlias({ zshrc });

    expect(first.changed).toBe(true);
    expect(second.changed).toBe(false);
    expect(removed.changed).toBe(true);
    expect(readFileSync(zshrc, "utf8")).toBe("export PATH=/tmp:$PATH\n");
  });

  it("upserts a Claude Stop hook without dropping existing settings", () => {
    const settings = tempFile("settings.json");
    writeFileSync(settings, JSON.stringify({ language: "korean", hooks: { SessionStart: [] } }, null, 2), "utf8");

    const result = upsertClaudeStopHook({ settingsPath: settings, cliPath: "/work/aidash/dist/cli.js" });
    const parsed = JSON.parse(readFileSync(settings, "utf8"));

    expect(result.changed).toBe(true);
    expect(parsed.language).toBe("korean");
    expect(parsed.hooks.SessionStart).toEqual([]);
    expect(JSON.stringify(parsed.hooks.Stop)).toContain("node /work/aidash/dist/cli.js import-claude-session");
  });

  it("installs a launchd agent plist for periodic one-shot Claude current snapshots", () => {
    const plist = tempFile("com.aidash.claude-current.plist");

    const result = installClaudeCurrentAgent({ plistPath: plist, cliPath: "/work/aidash/dist/cli.js", intervalSeconds: 5 });
    const content = readFileSync(plist, "utf8");

    expect(result.changed).toBe(true);
    expect(content).toContain("com.aidash.claude-current");
    expect(content).toContain("/work/aidash/dist/cli.js");
    expect(content).toContain("claude-current-daemon");
    expect(content).toContain("--once");
    expect(content).toContain("<key>StartInterval</key>");
    expect(content).toContain("<integer>5</integer>");
    expect(content).not.toContain("<key>KeepAlive</key>");
  });

  it("installs Claude Code /aiusage and /au slash commands together", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "aidash-commands-"));
    dirs.push(dir);

    const results = installClaudeUsageSlashCommands({ commandsDir: dir, cliPath: "/work/aidash/dist/cli.js" });

    expect(results.map((result) => result.path)).toEqual([path.join(dir, "aiusage.md"), path.join(dir, "au.md"), path.join(dir, "aidash-update.md")]);
    expect(readFileSync(path.join(dir, "aiusage.md"), "utf8")).toContain("!`node /work/aidash/dist/cli.js claude-current`");
    expect(readFileSync(path.join(dir, "au.md"), "utf8")).toContain("claude-current --compact");
    expect(readFileSync(path.join(dir, "aidash-update.md"), "utf8")).toContain("!`node /work/aidash/dist/cli.js update`");
  });

  it("installs the Claude Code package in one call", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "aidash-package-"));
    dirs.push(dir);
    const settingsPath = path.join(dir, "settings.json");
    const commandsDir = path.join(dir, "commands");

    const results = installClaudeCodePackage({ settingsPath, commandsDir, cliPath: "/work/aidash/dist/cli.js" });

    expect(results.map((result) => result.path)).toEqual([settingsPath, path.join(commandsDir, "aiusage.md"), path.join(commandsDir, "au.md"), path.join(commandsDir, "aidash-update.md")]);
    expect(readFileSync(settingsPath, "utf8")).toContain("import-claude-session");
    expect(readFileSync(path.join(commandsDir, "au.md"), "utf8")).toContain("claude-current --compact");
    expect(readFileSync(path.join(commandsDir, "aidash-update.md"), "utf8")).toContain("node /work/aidash/dist/cli.js update");
  });
});
