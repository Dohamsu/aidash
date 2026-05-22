import { describe, expect, it } from "vitest";
import { runAidashUpdateCommand } from "../src/commands/update.js";

describe("aidash update command", () => {
  it("prints the git/pnpm/reinstall update plan in dry-run mode", () => {
    const output = runAidashUpdateCommand({ dryRun: true, repoDir: "/work/aidash", cliPath: "/work/aidash/dist/cli.js" });

    expect(output).toContain("AIDash update dry run");
    expect(output).toContain("cd /work/aidash");
    expect(output).toContain("git pull origin main");
    expect(output).toContain("pnpm install");
    expect(output).toContain("pnpm build");
    expect(output).toContain("node /work/aidash/dist/cli.js install-claude --cli-path /work/aidash/dist/cli.js");
  });
});
