import { upsertMetric } from "@/modules/campaigns/repositories/campaign.repository";

import type { MetricsProvider } from "./metrics-provider";

/** Implementação de referência: métrica digitada manualmente por MANAGER/ANALYST. */
export const manualMetricsProvider: MetricsProvider = {
  source: "MANUAL",
  upsertDailyMetric(campaignId, input) {
    return upsertMetric(campaignId, input.date, "MANUAL", {
      impressions: input.impressions,
      reach: input.reach,
      clicks: input.clicks,
      leads: input.leads,
      conversions: input.conversions,
      spend: input.spend,
      revenue: input.revenue,
    });
  },
};
