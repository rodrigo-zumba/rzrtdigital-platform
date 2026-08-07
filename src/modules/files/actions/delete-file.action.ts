"use server";

import { revalidatePath } from "next/cache";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { deleteFileSchema } from "@/modules/files/schemas/file.schemas";
import { deleteFile } from "@/modules/files/services/file.service";

export async function deleteFileAction(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = deleteFileSchema.safeParse({
    organizationId: formData.get("organizationId"),
    fileId: formData.get("fileId"),
  });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError("Dados inválidos."));
  }

  const ctx = await requireRequestContext();

  try {
    await deleteFile(ctx, parsed.data.organizationId, parsed.data.fileId);
  } catch (error) {
    return toErrorResponse(error);
  }

  revalidatePath(`/admin/clientes/${parsed.data.organizationId}/arquivos`);
  revalidatePath("/portal/arquivos");
  return { ok: true, data: undefined };
}
