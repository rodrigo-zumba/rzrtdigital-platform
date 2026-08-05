import type { MetadataRoute } from "next";

// Painel de cliente: nunca indexável (CLAUDE.md §4.13), em nenhum ambiente.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
