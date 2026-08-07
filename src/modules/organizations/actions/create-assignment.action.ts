"use server";

import { revalidatePath } from "next/cache";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { createAssignmentSchema } from "@/modules/organizations/schemas/assignment.schemas";
import { createAssignment } from "@/modules/organizations/services/assignment.service";

export async function createAssignmentAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = createAssignmentSchema.safeParse({
    organizationId: formData.get("organizationId"),
    userId: formData.get("userId"),
    assignmentType: formData.get("assignmentType"),
  });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError(parsed.error.issues[0]?.message ?? "Dados inválidos."));
  }

  const ctx = await requireRequestContext();

  try {
    await createAssignment(ctx, parsed.data.organizationId, parsed.data.userId, parsed.data.assignmentType);
  } catch (error) {
    return toErrorResponse(error);
  }

  revalidatePath(`/admin/clientes/${parsed.data.organizationId}`);
  return { ok: true, data: undefined };
}
