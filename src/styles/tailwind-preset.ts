/**
 * Fonte da verdade: repositório do site institucional. Sincronizar
 * manualmente quando a marca mudar (docs/ESPECIFICACAO.md §0).
 *
 * Tailwind v4 não usa mais tailwind.config.ts para tema — a fonte real do
 * tema Tailwind é o bloco `@theme inline` em `src/styles/tokens.css`. Este
 * arquivo existe para expor os mesmos valores em contexto JS/TS (ex.: cores
 * de série para Recharts, e-mails transacionais em HTML), onde uma
 * `var(--color-x)` do CSS não está disponível.
 */

export const designTokens = {
  colors: {
    bg: "#05070d",
    bgSecondary: "#0a0f1c",
    surface: "#101728",
    surfaceHover: "#141d33",
    blue: "#2563eb",
    blueLight: "#38bdf8",
    purple: "#7c3aed",
    textPrimary: "#f8fafc",
    textSecondary: "#94a3b8",
    border: "rgba(148, 163, 184, 0.16)",
    borderStrong: "rgba(148, 163, 184, 0.32)",
    success: "#22c55e",
    warning: "#eab308",
    danger: "#ef4444",
  },
  fonts: {
    display: "var(--font-space-grotesk)",
    body: "var(--font-inter)",
  },
  radius: {
    sm: "0.5rem",
    md: "0.875rem",
    lg: "1.25rem",
    xl: "1.75rem",
  },
  chartSeries: ["#2563eb", "#38bdf8", "#7c3aed", "#22c55e", "#eab308", "#ef4444"],
} as const;
