"use server";

import { revalidatePath } from "next/cache";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { setProjectProgressSchema } from "@/modules/projects/schemas/project.schemas";
import { setProjectProgress } from "@/modules/projects/services/project.service";

export async function setProjectProgressAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = setProjectProgressSchema.safeParse({
    organizationId: formData.get("organizationId"),
    projectId: formData.get("projectId"),
    progress: formData.get("progress"),
  });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError(parsed.error.issues[0]?.message ?? "Dados inválidos."));
  }

  const ctx = await requireRequestContext();

  try {
    await setProjectProgress(ctx, parsed.data.organizationId, parsed.data.projectId, parsed.data.progress);
  } catch (error) {
    return toErrorResponse(error);
  }

  revalidatePath(`/admin/clientes/${parsed.data.organizationId}/projetos/${parsed.data.projectId}`);
  revalidatePath(`/portal/projetos/${parsed.data.projectId}`);
  return { ok: true, data: undefined };
}
