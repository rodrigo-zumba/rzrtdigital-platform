"use server";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { downloadFileSchema } from "@/modules/files/schemas/file.schemas";
import { getFileDownloadUrl } from "@/modules/files/services/file.service";

export async function downloadFileAction(
  organizationId: string,
  fileId: string,
): Promise<ActionResult<{ url: string }>> {
  const parsed = downloadFileSchema.safeParse({ organizationId, fileId });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError("Dados inválidos."));
  }

  const ctx = await requireRequestContext();

  try {
    const url = await getFileDownloadUrl(ctx, parsed.data.organizationId, parsed.data.fileId);
    return { ok: true, data: { url } };
  } catch (error) {
    return toErrorResponse(error);
  }
}
