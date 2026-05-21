import { installClaudeCodePackage, installClaudeCurrentAgent, installClaudeUsageSlashCommand, installClaudeUsageSlashCommands, installShellAlias, uninstallShellAlias, upsertClaudeStopHook } from "../core/install.js";

export type InstallCommandOptions = {
  dryRun?: boolean;
  zshrc?: string;
  settingsPath?: string;
  cliPath?: string;
  plistPath?: string;
  intervalSeconds?: number;
  commandPath?: string;
  commandsDir?: string;
};

export function runInstallShellCommand(options: InstallCommandOptions): string {
  const result = installShellAlias({ zshrc: options.zshrc, dryRun: options.dryRun });
  return formatResult(options.dryRun ? "Dry run" : "Shell install", result.message, result.path, result.preview);
}

export function runUninstallShellCommand(options: InstallCommandOptions): string {
  const result = uninstallShellAlias({ zshrc: options.zshrc, dryRun: options.dryRun });
  return formatResult(options.dryRun ? "Dry run" : "Shell uninstall", result.message, result.path, result.preview);
}

export function runInstallClaudeHookCommand(options: InstallCommandOptions): string {
  const result = upsertClaudeStopHook({ settingsPath: options.settingsPath, cliPath: options.cliPath, dryRun: options.dryRun });
  return formatResult(options.dryRun ? "Dry run" : "Claude hook install", result.message, result.path, result.preview);
}

export function runInstallClaudeCurrentAgentCommand(options: InstallCommandOptions): string {
  if (!options.cliPath) return "Claude current agent install: --cli-path is required so launchd can run AIDash from an absolute path.\n";
  const result = installClaudeCurrentAgent({ plistPath: options.plistPath, cliPath: options.cliPath, intervalSeconds: options.intervalSeconds, dryRun: options.dryRun });
  return formatResult(options.dryRun ? "Dry run" : "Claude current agent install", result.message, result.path, result.preview);
}

export function runInstallClaudeUsageCommand(options: InstallCommandOptions): string {
  if (!options.cliPath) return "Claude usage slash command install: --cli-path is required so Claude Code can run AIDash from an absolute path.\n";
  const results = options.commandsDir
    ? installClaudeUsageSlashCommands({ commandsDir: options.commandsDir, cliPath: options.cliPath, dryRun: options.dryRun })
    : [installClaudeUsageSlashCommand({ commandPath: options.commandPath, cliPath: options.cliPath, dryRun: options.dryRun })];
  return formatResults(options.dryRun ? "Dry run" : "Claude usage slash command install", results);
}

export function runInstallClaudePackageCommand(options: InstallCommandOptions): string {
  if (!options.cliPath) return "Claude package install: --cli-path is required so Claude Code can run AIDash from an absolute path.\n";
  const results = installClaudeCodePackage({ settingsPath: options.settingsPath, commandsDir: options.commandsDir, cliPath: options.cliPath, dryRun: options.dryRun });
  return formatResults(options.dryRun ? "Dry run" : "Claude package install", results);
}

function formatResults(prefix: string, results: Array<{ message: string; path: string; preview?: string }>): string {
  return results.map((result) => formatResult(prefix, result.message, result.path, result.preview)).join("");
}

function formatResult(prefix: string, message: string, file: string, preview?: string): string {
  return [`${prefix}: ${message}`, `Path: ${file}`, preview ? `Preview:\n${preview}` : undefined].filter(Boolean).join("\n") + "\n";
}
