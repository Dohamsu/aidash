import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const SHELL_START = "# >>> aidash claude wrapper >>>";
const SHELL_END = "# <<< aidash claude wrapper <<<";
const SHELL_BLOCK = `${SHELL_START}
claude() {
  aidash run claude "$@"
}
${SHELL_END}
`;
const DEFAULT_HOOK_COMMAND = "aidash import-claude-session";

export type InstallResult = {
  changed: boolean;
  path: string;
  message: string;
  preview?: string;
};

export function defaultZshrc(): string {
  return path.join(os.homedir(), ".zshrc");
}

export function defaultClaudeSettings(): string {
  return path.join(os.homedir(), ".claude", "settings.json");
}

export function defaultClaudeCurrentAgentPlist(): string {
  return path.join(os.homedir(), "Library", "LaunchAgents", "com.aidash.claude-current.plist");
}

export function defaultClaudeUsageSlashCommand(name = "aiusage"): string {
  return path.join(defaultClaudeCommandsDir(), `${name}.md`);
}

export function defaultClaudeCommandsDir(): string {
  return path.join(os.homedir(), ".claude", "commands");
}

export function installShellAlias(options: { zshrc?: string; dryRun?: boolean } = {}): InstallResult {
  const file = options.zshrc ?? defaultZshrc();
  const current = readIfExists(file);
  if (current.includes(SHELL_START)) return { changed: false, path: file, message: "AIDash shell wrapper already installed" };
  const next = `${current}${current && !current.endsWith("\n") ? "\n" : ""}\n${SHELL_BLOCK}`;
  if (!options.dryRun) writeText(file, next);
  return { changed: true, path: file, message: "Installed AIDash shell wrapper", preview: SHELL_BLOCK };
}

export function uninstallShellAlias(options: { zshrc?: string; dryRun?: boolean } = {}): InstallResult {
  const file = options.zshrc ?? defaultZshrc();
  const current = readIfExists(file);
  const pattern = new RegExp(`\\n?${escapeRegExp(SHELL_START)}[\\s\\S]*?${escapeRegExp(SHELL_END)}\\n?`, "m");
  if (!pattern.test(current)) return { changed: false, path: file, message: "AIDash shell wrapper is not installed" };
  const next = current.replace(pattern, current.endsWith("\n") ? "" : "\n");
  if (!options.dryRun) writeText(file, next);
  return { changed: true, path: file, message: "Removed AIDash shell wrapper" };
}

export function upsertClaudeStopHook(options: { settingsPath?: string; cliPath?: string; dryRun?: boolean } = {}): InstallResult {
  const file = options.settingsPath ?? defaultClaudeSettings();
  const hookCommand = options.cliPath ? `node ${options.cliPath} import-claude-session` : DEFAULT_HOOK_COMMAND;
  const settings = parseJsonObject(readIfExists(file)) ?? {};
  const hooks = asRecord(settings.hooks);
  const stopHooks = Array.isArray(hooks.Stop) ? hooks.Stop.slice() : [];
  const serialized = JSON.stringify(stopHooks);
  if (serialized.includes(hookCommand)) return { changed: false, path: file, message: "AIDash Claude Stop hook already installed" };

  stopHooks.push({
    matcher: "",
    hooks: [{ type: "command", command: hookCommand }],
  });
  const nextSettings = { ...settings, hooks: { ...hooks, Stop: stopHooks } };
  const nextText = `${JSON.stringify(nextSettings, null, 2)}\n`;
  if (!options.dryRun) writeText(file, nextText);
  return { changed: true, path: file, message: "Installed AIDash Claude Stop hook", preview: JSON.stringify(stopHooks.at(-1), null, 2) };
}

export function installClaudeCurrentAgent(
  options: { plistPath?: string; cliPath: string; intervalSeconds?: number; dryRun?: boolean } = { cliPath: "aidash" },
): InstallResult {
  const file = options.plistPath ?? defaultClaudeCurrentAgentPlist();
  const interval = Math.max(1, Math.round(options.intervalSeconds ?? 5));
  const plist = renderClaudeCurrentAgentPlist(options.cliPath, interval);
  const current = readIfExists(file);
  if (current === plist) return { changed: false, path: file, message: "AIDash Claude current launchd agent already installed" };
  if (!options.dryRun) writeText(file, plist);
  return { changed: true, path: file, message: "Installed AIDash Claude current launchd agent", preview: plist };
}

function renderClaudeCurrentAgentPlist(cliPath: string, intervalSeconds: number): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.aidash.claude-current</string>
  <key>ProgramArguments</key>
  <array>
    <string>node</string>
    <string>${escapeXml(cliPath)}</string>
    <string>claude-current-daemon</string>
    <string>--once</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>StartInterval</key>
  <integer>${intervalSeconds}</integer>
  <key>StandardOutPath</key>
  <string>${escapeXml(path.join(os.homedir(), ".aidash", "claude-current-daemon.log"))}</string>
  <key>StandardErrorPath</key>
  <string>${escapeXml(path.join(os.homedir(), ".aidash", "claude-current-daemon.err.log"))}</string>
</dict>
</plist>
`;
}

export function installClaudeUsageSlashCommand(options: { commandPath?: string; commandName?: string; cliPath: string; dryRun?: boolean }): InstallResult {
  const commandName = options.commandName ?? "aiusage";
  const file = options.commandPath ?? defaultClaudeUsageSlashCommand(commandName);
  const content = renderClaudeUsageSlashCommand(options.cliPath, commandName);
  const current = readIfExists(file);
  if (current === content) return { changed: false, path: file, message: `Claude Code /${commandName} command already installed` };
  if (!options.dryRun) writeText(file, content);
  return { changed: true, path: file, message: `Installed Claude Code /${commandName} command`, preview: content };
}

export function installClaudeUsageSlashCommands(options: { commandsDir?: string; names?: string[]; cliPath: string; dryRun?: boolean }): InstallResult[] {
  const dir = options.commandsDir ?? defaultClaudeCommandsDir();
  const names = options.names ?? ["aiusage", "au"];
  return names.map((name) => installClaudeUsageSlashCommand({ commandPath: path.join(dir, `${name}.md`), commandName: name, cliPath: options.cliPath, dryRun: options.dryRun }));
}

export function installClaudeCodePackage(options: { settingsPath?: string; commandsDir?: string; cliPath: string; dryRun?: boolean }): InstallResult[] {
  return [
    upsertClaudeStopHook({ settingsPath: options.settingsPath, cliPath: options.cliPath, dryRun: options.dryRun }),
    ...installClaudeUsageSlashCommands({ commandsDir: options.commandsDir, cliPath: options.cliPath, dryRun: options.dryRun }),
  ];
}

function renderClaudeUsageSlashCommand(cliPath: string, commandName: string): string {
  const currentCommand = commandName === "au" ? `node ${cliPath} claude-current --compact` : `node ${cliPath} claude-current`;
  const detailBlock = commandName === "au"
    ? ""
    : `
## Completed/imported totals

!\`node ${cliPath} usage --all-projects --style dashboard --no-color\`
`;
  return `---
description: Show AIDash Claude usage
allowed-tools: Bash(node ${cliPath} claude-current:*), Bash(node ${cliPath} usage:*)
---

Show my current Claude Code usage and completed-session totals.

## Current / recent Claude session

!\`${currentCommand}\`
${detailBlock}
`;
}

function readIfExists(file: string): string {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function writeText(file: string, text: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, "utf8");
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  if (!text.trim()) return {};
  try {
    const parsed = JSON.parse(text) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
