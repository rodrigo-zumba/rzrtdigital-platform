"use server";

import { revalidatePath } from "next/cache";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { removeAssignmentSchema } from "@/modules/organizations/schemas/assignment.schemas";
import { removeAssignment } from "@/modules/organizations/services/assignment.service";

export async function removeAssignmentAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = removeAssignmentSchema.safeParse({
    organizationId: formData.get("organizationId"),
    assignmentId: formData.get("assignmentId"),
  });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError("Dados inválidos."));
  }

  const ctx = await requireRequestContext();

  try {
    await removeAssignment(ctx, parsed.data.organizationId, parsed.data.assignmentId);
  } catch (error) {
    return toErrorResponse(error);
  }

  revalidatePath(`/admin/clientes/${parsed.data.organizationId}`);
  return { ok: true, data: undefined };
}
