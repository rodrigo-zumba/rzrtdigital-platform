"use server";

import { revalidatePath } from "next/cache";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { setCampaignStatusSchema } from "@/modules/campaigns/schemas/campaign.schemas";
import { setCampaignStatus } from "@/modules/campaigns/services/campaign.service";

export async function setCampaignStatusAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = setCampaignStatusSchema.safeParse({
    organizationId: formData.get("organizationId"),
    campaignId: formData.get("campaignId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError(parsed.error.issues[0]?.message ?? "Dados inválidos."));
  }

  const ctx = await requireRequestContext();

  try {
    await setCampaignStatus(ctx, parsed.data.organizationId, parsed.data.campaignId, parsed.data.status);
  } catch (error) {
    return toErrorResponse(error);
  }

  revalidatePath(`/admin/clientes/${parsed.data.organizationId}/campanhas/${parsed.data.campaignId}`);
  revalidatePath(`/portal/campanhas/${parsed.data.campaignId}`);
  return { ok: true, data: undefined };
}
