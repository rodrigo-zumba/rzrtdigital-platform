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
