/**
 * Camada isolada de integração de métricas (docs/ESPECIFICACAO.md §14,
 * "Fase 5 — Evolução"). Nenhum componente ou service fora deste diretório
 * fala com uma API externa de anúncios — tudo passa por esta interface.
 * `MANUAL` (manual-provider.ts) é a implementação de referência: métricas
 * digitadas por um humano no formulário, não buscadas de fora.
 *
 * Um provider futuro (Meta Ads, Google Ads, GA4, TikTok Ads) implementa a
 * mesma interface e é plugado no service sem o dashboard/página saberem a
 * diferença — só o `source` da métrica muda.
 */
import type { MetricSource } from "@prisma/client";

export type DailyMetricInput = {
  date: Date;
  impressions: number;
  reach?: number;
  clicks: number;
  leads: number;
  conversions: number;
  spend: number;
  revenue?: number;
};

export interface MetricsProvider {
  readonly source: MetricSource;
  upsertDailyMetric(campaignId: string, input: DailyMetricInput): Promise<unknown>;
}
