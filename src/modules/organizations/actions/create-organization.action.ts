"use server";

import { redirect } from "next/navigation";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { createOrganizationSchema } from "@/modules/organizations/schemas/organization.schemas";
import { createOrganization } from "@/modules/organizations/services/organization.service";

export async function createOrganizationAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = createOrganizationSchema.safeParse({
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

  let organizationId: string;
  try {
    const organization = await createOrganization(ctx, parsed.data);
    organizationId = organization.id;
  } catch (error) {
    return toErrorResponse(error);
  }

  redirect(`/admin/clientes/${organizationId}?criado=1`);
}
