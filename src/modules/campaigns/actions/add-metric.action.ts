"use server";

import { revalidatePath } from "next/cache";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { addMetricSchema } from "@/modules/campaigns/schemas/campaign.schemas";
import { addManualMetric } from "@/modules/campaigns/services/campaign.service";

export async function addMetricAction(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = addMetricSchema.safeParse({
    organizationId: formData.get("organizationId"),
    campaignId: formData.get("campaignId"),
    date: formData.get("date"),
    impressions: formData.get("impressions"),
    clicks: formData.get("clicks"),
    leads: formData.get("leads"),
    conversions: formData.get("conversions"),
    spend: formData.get("spend"),
    revenue: formData.get("revenue"),
  });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError(parsed.error.issues[0]?.message ?? "Dados inválidos."));
  }

  const ctx = await requireRequestContext();
  const { organizationId, campaignId, date, ...metricInput } = parsed.data;

  try {
    await addManualMetric(ctx, organizationId, campaignId, { date: new Date(date), ...metricInput });
  } catch (error) {
    return toErrorResponse(error);
  }

  revalidatePath(`/admin/clientes/${organizationId}/campanhas/${campaignId}`);
  revalidatePath(`/portal/campanhas/${campaignId}`);
  return { ok: true, data: undefined };
}
