import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // В тестах нет окружения RSC, поэтому «server-only» подменяем пустым модулем.
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: { include: ["tests/**/*.test.ts"], testTimeout: 30_000, hookTimeout: 60_000 },
});
