import type { ProjectStatus } from "@prisma/client";

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

export type ProjectStats = {
  byStatus: Record<ProjectStatus, number>;
  avgProgressInProgress: number | null;
};

/**
 * Card "projetos" do dashboard (Etapa 4). `organizationIds` undefined =
 * sem restrição de escopo (chave "organizationId" ainda precisa estar
 * presente no where para o tenant guard — ver src/lib/db/tenant-guard.ts).
 */
export async function getProjectStats(organizationIds?: string[]): Promise<ProjectStats> {
  const where = { organizationId: organizationIds ? { in: organizationIds } : undefined };

  const [groups, inProgressAvg] = await Promise.all([
    db.project.groupBy({ by: ["status"], where, _count: { _all: true } }),
    db.project.aggregate({ where: { ...where, status: "IN_PROGRESS" }, _avg: { progress: true } }),
  ]);

  const byStatus: Record<ProjectStatus, number> = {
    PLANNING: 0,
    IN_PROGRESS: 0,
    ON_HOLD: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };
  for (const group of groups) byStatus[group.status] = group._count._all;

  return { byStatus, avgProgressInProgress: inProgressAvg._avg.progress };
}
