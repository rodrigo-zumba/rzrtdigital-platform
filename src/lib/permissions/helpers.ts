import type { InternalRole, MemberRole } from "@prisma/client";

import type { RequestContext } from "@/lib/auth/types";
import { ForbiddenError } from "@/lib/errors";
import { findOrganizationIdByProjectId } from "@/modules/projects/repositories/project.repository";
import { findRoleInfoById } from "@/modules/users/repositories/user.repository";

import { CLIENT_ROLE_PERMISSIONS, INTERNAL_ROLE_PERMISSIONS, type Permission } from "./matrix";

/** can(): o que esse usuário pode fazer, pela role — não diz nada sobre escopo. */
export function hasPermission(ctx: RequestContext, permission: Permission): boolean {
  if (ctx.kind === "INTERNAL") {
    return INTERNAL_ROLE_PERMISSIONS[ctx.internalRole].includes(permission);
  }

  // Um CLIENT pode ter papéis diferentes em organizações diferentes; para a
  // checagem de "can" (sem organização em mente) usamos o papel mais
  // permissivo entre as memberships ativas.
  return ctx.memberships.some((membership) => CLIENT_ROLE_PERMISSIONS[membership.role].includes(permission));
}

export function requirePermission(ctx: RequestContext, permission: Permission): void {
  if (!hasPermission(ctx, permission)) {
    throw new ForbiddenError();
  }
}

/**
 * scope(): sobre quais organizações. INTERNAL com SUPER_ADMIN/ADMIN vê
 * todas; MANAGER/ANALYST só as atribuídas (OrganizationAssignment). CLIENT
 * só as que tem membership ativa.
 */
export function canAccessOrganization(ctx: RequestContext, organizationId: string): boolean {
  if (ctx.kind === "INTERNAL") {
    if (ctx.internalRole === "SUPER_ADMIN" || ctx.internalRole === "ADMIN") {
      return true;
    }
    return ctx.assignments.some((assignment) => assignment.organizationId === organizationId);
  }

  return ctx.memberships.some((membership) => membership.organizationId === organizationId);
}

export function assertOrganizationAccess(ctx: RequestContext, organizationId: string): void {
  if (!canAccessOrganization(ctx, organizationId)) {
    throw new ForbiddenError();
  }
}

/**
 * Resolve o organizationId do projeto (findUnique por id — Project não
 * expõe filtro seguro sem conhecer o tenant de antemão) e só então valida o
 * escopo. Nunca confiar no organizationId vindo do request.
 */
export async function canAccessProject(ctx: RequestContext, projectId: string): Promise<boolean> {
  const project = await findOrganizationIdByProjectId(projectId);
  if (!project || project.deletedAt) return false;
  return canAccessOrganization(ctx, project.organizationId);
}

const INTERNAL_ROLE_RANK: Record<InternalRole, number> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  MANAGER: 2,
  ANALYST: 1,
};

const CLIENT_ROLE_RANK: Record<MemberRole, number> = {
  CLIENT_ADMIN: 3,
  CLIENT_MEMBER: 2,
  CLIENT_VIEWER: 1,
};

/**
 * Ninguém concede papel superior ao seu, nem edita/suspende usuário de
 * nível igual ou superior (docs/ESPECIFICACAO.md §4). Combina escopo
 * (organização) e hierarquia (rank do papel). A regra "SUPER_ADMIN não pode
 * se auto-remover se for o último ativo" é responsabilidade do service de
 * users.remove/suspend (Fase 2), não deste helper genérico.
 */
export async function canManageUser(ctx: RequestContext, targetUserId: string): Promise<boolean> {
  if (ctx.userId === targetUserId) return true;

  const target = await findRoleInfoById(targetUserId);
  if (!target) return false;

  if (ctx.kind === "INTERNAL") {
    if (target.type === "INTERNAL") {
      const targetRole = target.internalProfile?.internalRole;
      if (!targetRole) return false;
      return INTERNAL_ROLE_RANK[ctx.internalRole] > INTERNAL_ROLE_RANK[targetRole];
    }

    // INTERNAL gerenciando CLIENT: precisa de escopo sobre ao menos uma das
    // organizações do alvo (não há comparação de hierarquia entre eixos).
    return target.organizationMemberships.some((membership) =>
      canAccessOrganization(ctx, membership.organizationId),
    );
  }

  // CLIENT só gerencia outro CLIENT da mesma organização, e só rank inferior.
  if (target.type !== "CLIENT") return false;

  return ctx.memberships.some((myMembership) =>
    target.organizationMemberships.some(
      (targetMembership) =>
        targetMembership.organizationId === myMembership.organizationId &&
        CLIENT_ROLE_RANK[myMembership.role] > CLIENT_ROLE_RANK[targetMembership.role],
    ),
  );
}
