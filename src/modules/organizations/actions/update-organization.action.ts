"use server";

import { revalidatePath } from "next/cache";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { updateOrganizationSchema } from "@/modules/organizations/schemas/organization.schemas";
import { updateOrganization } from "@/modules/organizations/services/organization.service";

export async function updateOrganizationAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = updateOrganizationSchema.safeParse({
    organizationId: formData.get("organizationId"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    legalName: formData.get("legalName"),
    document: formData.get("document"),
    website: formData.get("website"),
    phone: formData.get("phone"),
    segment: formData.get("segment"),
  });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError(parsed.error.issues[0]?.message ?? "Dados inválidos."));
  }

  const ctx = await requireRequestContext();
  const { organizationId, ...input } = parsed.data;

  try {
    await updateOrganization(ctx, organizationId, input);
  } catch (error) {
    return toErrorResponse(error);
  }

  revalidatePath(`/admin/clientes/${organizationId}`);
  revalidatePath("/admin/clientes");
  return { ok: true, data: undefined };
}
