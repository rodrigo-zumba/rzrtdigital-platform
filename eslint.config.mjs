import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const PRISMA_ACCESS_MESSAGE =
  "Acesso ao Prisma (@/lib/db) só é permitido dentro de src/modules/*/repositories/. Crie ou use um repository (CLAUDE.md §4.1).";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [{ name: "@/lib/db", message: PRISMA_ACCESS_MESSAGE }],
          patterns: [
            {
              group: ["@/lib/db/*", "*/lib/db", "*/lib/db/*"],
              message: PRISMA_ACCESS_MESSAGE,
            },
          ],
        },
      ],
    },
  },
  {
    // Única exceção: repositories são a única camada autorizada a falar com o Prisma.
    files: ["src/modules/*/repositories/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "src/generated/**",
  ]),
]);

export default eslintConfig;
