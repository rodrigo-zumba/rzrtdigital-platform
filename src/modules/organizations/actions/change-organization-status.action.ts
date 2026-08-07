"use server";

import { revalidatePath } from "next/cache";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { changeOrganizationStatusSchema } from "@/modules/organizations/schemas/organization.schemas";
import { changeOrganizationStatus } from "@/modules/organizations/services/organization.service";

export async function changeOrganizationStatusAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = changeOrganizationStatusSchema.safeParse({
    organizationId: formData.get("organizationId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError(parsed.error.issues[0]?.message ?? "Dados inválidos."));
  }

  const ctx = await requireRequestContext();

  try {
    await changeOrganizationStatus(ctx, parsed.data.organizationId, parsed.data.status);
  } catch (error) {
    return toErrorResponse(error);
  }

  revalidatePath(`/admin/clientes/${parsed.data.organizationId}`);
  revalidatePath("/admin/clientes");
  return { ok: true, data: undefined };
}
