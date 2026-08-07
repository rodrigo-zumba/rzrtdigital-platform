"use server";

import { redirect } from "next/navigation";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { archiveCampaignSchema } from "@/modules/campaigns/schemas/campaign.schemas";
import { archiveCampaign } from "@/modules/campaigns/services/campaign.service";

export async function archiveCampaignAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = archiveCampaignSchema.safeParse({
    organizationId: formData.get("organizationId"),
    campaignId: formData.get("campaignId"),
  });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError("Dados inválidos."));
  }

  const ctx = await requireRequestContext();

  try {
    await archiveCampaign(ctx, parsed.data.organizationId, parsed.data.campaignId);
  } catch (error) {
    return toErrorResponse(error);
  }

  redirect(`/admin/clientes/${parsed.data.organizationId}/campanhas`);
}
