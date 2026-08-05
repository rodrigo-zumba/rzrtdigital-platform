import type { AssignmentType, InternalRole, MemberRole, MemberStatus } from "@prisma/client";

export type InternalContext = {
  kind: "INTERNAL";
  internalRole: InternalRole;
  assignments: ReadonlyArray<{ organizationId: string; assignmentType: AssignmentType }>;
};

export type ClientContext = {
  kind: "CLIENT";
  memberships: ReadonlyArray<{
    organizationId: string;
    organizationName: string;
    role: MemberRole;
    status: MemberStatus;
  }>;
};

/**
 * Resolvido do banco a cada request por getRequestContext() (CLAUDE.md §4.4)
 * — nunca a partir do JWT, que carrega só userId. Sempre reflete o estado
 * atual (suspender usuário derruba acesso no request seguinte).
 */
export type RequestContext = {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
} & (InternalContext | ClientContext);
