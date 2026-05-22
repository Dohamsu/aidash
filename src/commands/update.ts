import { spawnSync } from "node:child_process";
import * as path from "node:path";

export type AidashUpdateOptions = {
  dryRun?: boolean;
  repoDir?: string;
  cliPath?: string;
  remote?: string;
  branch?: string;
};

type UpdateStep = {
  command: string;
  args: string[];
};

export function runAidashUpdateCommand(options: AidashUpdateOptions = {}): string {
  const repoDir = path.resolve(options.repoDir ?? path.join(path.dirname(process.argv[1] ?? process.cwd()), ".."));
  const cliPath = path.resolve(options.cliPath ?? process.argv[1] ?? path.join(repoDir, "dist", "cli.js"));
  const remote = options.remote ?? "origin";
  const branch = options.branch ?? "main";
  const steps = updateSteps(cliPath, remote, branch);

  if (options.dryRun) {
    return [
      "AIDash update dry run",
      `Repo: ${repoDir}`,
      `CLI: ${cliPath}`,
      "Commands:",
      `cd ${repoDir}`,
      ...steps.map(formatStep),
      "",
    ].join("\n");
  }

  const lines = [`AIDash update`, `Repo: ${repoDir}`, `CLI: ${cliPath}`];
  for (const step of steps) {
    lines.push(`$ ${formatStep(step)}`);
    const result = spawnSync(step.command, step.args, { cwd: repoDir, encoding: "utf8" });
    if (result.stdout) lines.push(result.stdout.trimEnd());
    if (result.stderr) lines.push(result.stderr.trimEnd());
    if (result.status !== 0) {
      lines.push(`Failed: ${formatStep(step)} exited with ${result.status ?? "unknown"}`);
      return `${lines.filter(Boolean).join("\n")}\n`;
    }
  }
  lines.push("AIDash update complete");
  return `${lines.filter(Boolean).join("\n")}\n`;
}

function updateSteps(cliPath: string, remote: string, branch: string): UpdateStep[] {
  return [
    { command: "git", args: ["pull", remote, branch] },
    { command: "pnpm", args: ["install"] },
    { command: "pnpm", args: ["build"] },
    { command: "node", args: [cliPath, "install-claude", "--cli-path", cliPath] },
  ];
}

function formatStep(step: UpdateStep): string {
  return [step.command, ...step.args].join(" ");
}
