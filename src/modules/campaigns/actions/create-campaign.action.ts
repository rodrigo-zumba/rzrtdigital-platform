"use server";

import { redirect } from "next/navigation";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { createCampaignSchema } from "@/modules/campaigns/schemas/campaign.schemas";
import { createCampaign } from "@/modules/campaigns/services/campaign.service";

export async function createCampaignAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = createCampaignSchema.safeParse({
    organizationId: formData.get("organizationId"),
    name: formData.get("name"),
    platform: formData.get("platform"),
    objective: formData.get("objective"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    budget: formData.get("budget"),
  });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError(parsed.error.issues[0]?.message ?? "Dados inválidos."));
  }

  const ctx = await requireRequestContext();
  const { organizationId, ...input } = parsed.data;

  let campaignId: string;
  try {
    const campaign = await createCampaign(ctx, organizationId, input);
    campaignId = campaign.id;
  } catch (error) {
    return toErrorResponse(error);
  }

  const basePath = ctx.kind === "INTERNAL" ? `/admin/clientes/${organizationId}` : "/portal";
  redirect(`${basePath}/campanhas/${campaignId}`);
}
