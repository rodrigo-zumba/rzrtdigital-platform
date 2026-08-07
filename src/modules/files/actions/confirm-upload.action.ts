"use server";

import { revalidatePath } from "next/cache";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { confirmUploadSchema } from "@/modules/files/schemas/file.schemas";
import { confirmFileUpload } from "@/modules/files/services/file.service";

export async function confirmUploadAction(params: {
  organizationId: string;
  storageKey: string;
  originalName: string;
  mimeType: string;
  size: number;
}): Promise<ActionResult> {
  const parsed = confirmUploadSchema.safeParse(params);

  if (!parsed.success) {
    return toErrorResponse(new ValidationError(parsed.error.issues[0]?.message ?? "Dados inválidos."));
  }

  const ctx = await requireRequestContext();
  const { organizationId, ...input } = parsed.data;

  try {
    await confirmFileUpload(ctx, organizationId, input);
  } catch (error) {
    return toErrorResponse(error);
  }

  revalidatePath(`/admin/clientes/${organizationId}/arquivos`);
  revalidatePath("/portal/arquivos");
  return { ok: true, data: undefined };
}
