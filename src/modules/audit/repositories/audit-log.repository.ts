import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

export type AuditLogEntry = {
  actorUserId: string | null;
  organizationId: string | null;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
};

/**
 * Toda operação de escrita relevante grava AuditLog (CLAUDE.md §4.8) — desde
 * a Fase 1. Metadata nunca contém senha, token ou segredo; quem chama esta
 * função é responsável por garantir isso. Para escritas dentro de uma
 * transação, use `tx.auditLog.create(...)` direto no repository que já
 * está compondo a transação — este helper é para o caso comum fora de tx.
 */
export function createAuditLog(entry: AuditLogEntry) {
  return db.auditLog.create({ data: entry });
}

export type AuditLogFilters = { organizationId?: string; action?: string };

/**
 * AuditLog é tenant-scoped mas `organizationId` é opcional no schema (ações
 * fora do contexto de uma organização, ex.: mudança de role interno). Sem
 * filtro de organização explícito, `organizationId: undefined` só satisfaz
 * a presença de chave exigida pelo tenant guard — não restringe a busca
 * (tela de logs é exclusiva de SUPER_ADMIN, que já vê tudo).
 */
export function listAuditLogs(filters: AuditLogFilters, params: { skip: number; take: number }) {
  return db.auditLog.findMany({
    where: {
      organizationId: filters.organizationId ?? undefined,
      ...(filters.action ? { action: filters.action } : {}),
    },
    include: { actor: { select: { name: true, email: true } }, organization: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    skip: params.skip,
    take: params.take,
  });
}

export function countAuditLogs(filters: AuditLogFilters) {
  return db.auditLog.count({
    where: {
      organizationId: filters.organizationId ?? undefined,
      ...(filters.action ? { action: filters.action } : {}),
    },
  });
}
