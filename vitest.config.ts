import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
    include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx"],
    // Testes de integração tocam Postgres real e podem cair no fail-open do
    // rate limit (Upstash inacessível em dev) — mais lento que o default.
    testTimeout: 20000,
  },
});
