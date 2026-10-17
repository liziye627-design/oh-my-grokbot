import { defineConfig } from "vitest/config";

const slowRunner = process.platform === "win32";

// biome-ignore lint/style/noDefaultExport: Vitest loads the default export.
export default defineConfig({
  test: {
    testTimeout: slowRunner ? 60_000 : 5_000,
    hookTimeout: slowRunner ? 60_000 : 10_000,
  },
});
