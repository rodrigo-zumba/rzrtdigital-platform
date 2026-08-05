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
          // Só os módulos que de fato tocam o Prisma (`db` estendido e o
          // client cru). Os helpers puros de src/lib/db/ (tenant-guard,
          // tenant-scoped-models) não importam o Prisma e ficam de fora —
          // são testados diretamente em tests/unit/.
          paths: [
            { name: "@/lib/db", message: PRISMA_ACCESS_MESSAGE },
            { name: "@/lib/db/client", message: PRISMA_ACCESS_MESSAGE },
            { name: "@/lib/db/index", message: PRISMA_ACCESS_MESSAGE },
          ],
        },
      ],
    },
  },
  {
    // Repositories são a única camada de app autorizada a falar com o
    // Prisma. Testes de integração também podem — só para montar fixtures
    // (criar/limpar dados de teste), nunca regra de negócio.
    files: ["src/modules/*/repositories/**/*.{ts,tsx}", "tests/integration/**/*.{ts,tsx}"],
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
