import { createUsageStore } from "../core/store.js";

export type InitCommandOptions = {
  home?: string;
};

export function runInitCommand(options: InitCommandOptions = {}): string {
  const store = createUsageStore(options.home);
  store.init();
  return `AIDash store initialized\nPath: ${store.file}\n`;
}
