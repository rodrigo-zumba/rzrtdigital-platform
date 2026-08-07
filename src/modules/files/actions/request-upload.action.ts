"use server";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { requestUploadSchema } from "@/modules/files/schemas/file.schemas";
import { requestFileUpload } from "@/modules/files/services/file.service";

/**
 * Chamada imperativa direto de um client component (não `<form action>`):
 * o browser precisa do `uploadUrl` antes de fazer o PUT direto pro bucket
 * (CLAUDE.md §2 — upload nunca passa pelo route handler/nosso servidor).
 */
export async function requestUploadAction(
  organizationId: string,
  originalName: string,
  mimeType: string,
  size: number,
): Promise<ActionResult<{ uploadUrl: string; storageKey: string }>> {
  const parsed = requestUploadSchema.safeParse({ organizationId, originalName, mimeType, size });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError(parsed.error.issues[0]?.message ?? "Dados inválidos."));
  }

  const ctx = await requireRequestContext();

  try {
    const result = await requestFileUpload(ctx, parsed.data.organizationId, parsed.data);
    return { ok: true, data: result };
  } catch (error) {
    return toErrorResponse(error);
  }
}
