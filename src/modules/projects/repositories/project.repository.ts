import { db } from "@/lib/db";

/**
 * Módulo de projetos (páginas, CRUD) é Fase 4. Este único lookup existe
 * porque canAccessProject (docs/ESPECIFICACAO.md §4) precisa resolver o
 * organizationId de um projeto a partir só do id — por isso é um
 * `findUnique` (não exige organizationId no where, ver src/lib/db/tenant-
 * guard.ts) seguido de comparação explícita contra o escopo do ctx, feita
 * pelo helper que chama esta função. Nunca usar o organizationId retornado
 * aqui como filtro sem essa comparação.
 */
export function findOrganizationIdByProjectId(projectId: string) {
  return db.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true, deletedAt: true },
  });
}
