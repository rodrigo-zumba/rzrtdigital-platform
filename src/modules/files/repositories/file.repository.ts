import type { FileVisibility } from "@prisma/client";

import { db } from "@/lib/db";

/**
 * CLIENT só vê arquivos com `visibility: CLIENT` — nunca `INTERNAL`
 * (docs/PROMPTS.md Etapa 5, mesmo princípio do DRAFT de Report).
 * `visibilityFilter` é decidido pelo service a partir do `ctx`.
 */
export function listFiles(
  organizationId: string,
  visibilityFilter: FileVisibility[] | undefined,
  params: { skip: number; take: number },
) {
  return db.file.findMany({
    where: { organizationId, status: "ACTIVE", ...(visibilityFilter ? { visibility: { in: visibilityFilter } } : {}) },
    orderBy: { createdAt: "desc" },
    skip: params.skip,
    take: params.take,
  });
}

export function countFiles(organizationId: string, visibilityFilter: FileVisibility[] | undefined) {
  return db.file.count({
    where: { organizationId, status: "ACTIVE", ...(visibilityFilter ? { visibility: { in: visibilityFilter } } : {}) },
  });
}

export function createFileRecord(
  organizationId: string,
  uploadedById: string,
  input: {
    name: string;
    originalName: string;
    storageKey: string;
    mimeType: string;
    size: number;
    visibility: FileVisibility;
  },
) {
  return db.file.create({
    data: {
      organizationId,
      uploadedById,
      name: input.name,
      originalName: input.originalName,
      storageKey: input.storageKey,
      mimeType: input.mimeType,
      size: input.size,
      visibility: input.visibility,
      status: "ACTIVE",
    },
  });
}

export function findFileById(organizationId: string, fileId: string) {
  return db.file.findFirst({ where: { id: fileId, organizationId } });
}

export function softDeleteFile(organizationId: string, fileId: string) {
  return db.file.update({ where: { id: fileId, organizationId }, data: { deletedAt: new Date() } });
}
