"use server";

import { redirect } from "next/navigation";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { deleteOrganizationSchema } from "@/modules/organizations/schemas/organization.schemas";
import { deleteOrganization } from "@/modules/organizations/services/organization.service";

export async function deleteOrganizationAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = deleteOrganizationSchema.safeParse({ organizationId: formData.get("organizationId") });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError("Dados inválidos."));
  }

  const ctx = await requireRequestContext();

  try {
    await deleteOrganization(ctx, parsed.data.organizationId);
  } catch (error) {
    return toErrorResponse(error);
  }

  redirect("/admin/clientes?excluido=1");
}
