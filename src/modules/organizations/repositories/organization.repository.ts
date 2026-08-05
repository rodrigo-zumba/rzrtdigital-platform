import { db } from "@/lib/db";

/**
 * CRUD completo de organizações é Fase 2 (docs/ESPECIFICACAO.md §14). Este
 * repository só tem o lookup que o módulo de convites (Fase 1) precisa para
 * validar o organizationId informado antes de criar/aceitar um convite.
 */
export function findById(organizationId: string) {
  // Organization é o próprio tenant — não está em TENANT_SCOPED_MODELS
  // (docs/ESPECIFICACAO.md §2), então não exige organizationId no where.
  return db.organization.findUnique({ where: { id: organizationId } });
}
