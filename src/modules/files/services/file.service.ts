import type { FileVisibility } from "@prisma/client";

import type { RequestContext } from "@/lib/auth/types";
import { NotFoundError } from "@/lib/errors";
import { assertOrganizationAccess, requirePermission } from "@/lib/permissions";
import { buildStorageKey, createDownloadUrl, createUploadUrl } from "@/lib/storage/presign";
import { createAuditLog } from "@/modules/audit/repositories/audit-log.repository";
import {
  countFiles,
  createFileRecord,
  findFileById,
  listFiles as listFilesRows,
  softDeleteFile,
} from "@/modules/files/repositories/file.repository";

const PAGE_SIZE = 20;

function visibilityFilterFor(ctx: RequestContext): FileVisibility[] | undefined {
  return ctx.kind === "CLIENT" ? ["CLIENT", "PROJECT_MEMBERS"] : undefined;
}

export async function listFiles(ctx: RequestContext, organizationId: string, page: number) {
  requirePermission(ctx, "files.download");
  assertOrganizationAccess(ctx, organizationId);

  const visibilityFilter = visibilityFilterFor(ctx);
  const [items, total] = await Promise.all([
    listFilesRows(organizationId, visibilityFilter, { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    countFiles(organizationId, visibilityFilter),
  ]);

  return { items, total, page, pageSize: PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function requestFileUpload(
  ctx: RequestContext,
  organizationId: string,
  input: { originalName: string; mimeType: string },
) {
  requirePermission(ctx, "files.upload");
  assertOrganizationAccess(ctx, organizationId);

  const storageKey = buildStorageKey(organizationId, input.originalName);
  const uploadUrl = await createUploadUrl(storageKey, input.mimeType);

  return { uploadUrl, storageKey };
}

export async function confirmFileUpload(
  ctx: RequestContext,
  organizationId: string,
  input: {
    storageKey: string;
    originalName: string;
    mimeType: string;
    size: number;
    visibility: FileVisibility;
  },
) {
  requirePermission(ctx, "files.upload");
  assertOrganizationAccess(ctx, organizationId);

  // storageKey é sempre gerado por requestFileUpload com prefixo da própria
  // organização (buildStorageKey) — recusa confirmar upload para uma chave
  // que não comece com o organizationId do ctx (IDOR guard).
  if (!input.storageKey.startsWith(`${organizationId}/`)) {
    throw new NotFoundError("Upload não encontrado.");
  }

  const file = await createFileRecord(organizationId, ctx.userId, {
    name: input.originalName,
    originalName: input.originalName,
    storageKey: input.storageKey,
    mimeType: input.mimeType,
    size: input.size,
    visibility: input.visibility,
  });

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId,
    action: "file.upload",
    entityType: "File",
    entityId: file.id,
    metadata: { name: file.name, size: file.size },
  });

  return file;
}

export async function getFileDownloadUrl(ctx: RequestContext, organizationId: string, fileId: string) {
  requirePermission(ctx, "files.download");
  assertOrganizationAccess(ctx, organizationId);

  const file = await findFileById(organizationId, fileId);
  if (!file || file.deletedAt) throw new NotFoundError("Arquivo não encontrado.");
  if (ctx.kind === "CLIENT" && file.visibility === "INTERNAL") throw new NotFoundError("Arquivo não encontrado.");

  return createDownloadUrl(file.storageKey);
}

export async function deleteFile(ctx: RequestContext, organizationId: string, fileId: string) {
  requirePermission(ctx, "files.delete");
  assertOrganizationAccess(ctx, organizationId);

  const file = await findFileById(organizationId, fileId);
  if (!file || file.deletedAt) throw new NotFoundError("Arquivo não encontrado.");

  await softDeleteFile(organizationId, fileId);

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId,
    action: "file.delete",
    entityType: "File",
    entityId: fileId,
    metadata: { name: file.name },
  });
}
