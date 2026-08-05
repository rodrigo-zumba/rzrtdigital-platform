import type { InternalRole, MemberRole, UserType } from "@prisma/client";

import { db } from "@/lib/db";

export function findPendingByEmailAndOrganization(email: string, organizationId: string | null) {
  return db.invitation.findFirst({
    where: { email, organizationId, status: "PENDING" },
  });
}

export function revokeInvitation(id: string, organizationId: string | null) {
  return db.invitation.update({
    where: { id, organizationId },
    data: { status: "REVOKED", revokedAt: new Date() },
  });
}

export function createInvitation(params: {
  email: string;
  organizationId: string | null;
  targetType: UserType;
  role: string;
  tokenHash: string;
  invitedById: string;
  expiresAt: Date;
}) {
  return db.invitation.create({
    data: {
      email: params.email,
      organizationId: params.organizationId,
      targetType: params.targetType,
      role: params.role,
      tokenHash: params.tokenHash,
      invitedById: params.invitedById,
      expiresAt: params.expiresAt,
    },
  });
}

/**
 * `findUnique` por tokenHash — não há organizationId conhecido de antemão
 * (é isso que estamos descobrindo). O caller valida email/expiração/status
 * explicitamente depois deste lookup.
 */
export function findByTokenHash(tokenHash: string) {
  return db.invitation.findUnique({ where: { tokenHash } });
}

export function markAccepted(id: string, organizationId: string | null) {
  return db.invitation.update({
    where: { id, organizationId },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  });
}

type AcceptedInvitation = {
  id: string;
  email: string;
  organizationId: string | null;
  invitedById: string;
  targetType: UserType;
  role: string;
};

/**
 * Cria o User a partir de um convite aceito, junto com a
 * OrganizationMember (CLIENT) ou InternalUserProfile (INTERNAL), e o
 * AuditLog — tudo em uma transação (CLAUDE.md §5, §4.8). Vive aqui (e não
 * em modules/audit) porque é específico do fluxo de aceite de convite.
 */
export function acceptInvitationTransaction(invitation: AcceptedInvitation, params: { name: string; passwordHash: string }) {
  return db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: params.name,
        email: invitation.email,
        passwordHash: params.passwordHash,
        type: invitation.targetType,
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        passwordChangedAt: new Date(),
      },
    });

    if (invitation.targetType === "CLIENT" && invitation.organizationId) {
      await tx.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: invitation.organizationId,
          role: invitation.role as MemberRole,
          status: "ACTIVE",
          invitedById: invitation.invitedById,
          joinedAt: new Date(),
        },
      });
    } else {
      await tx.internalUserProfile.create({
        data: { userId: user.id, internalRole: invitation.role as InternalRole },
      });
    }

    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        organizationId: invitation.organizationId,
        action: "invitation.accept",
        entityType: "User",
        entityId: user.id,
        metadata: { invitationId: invitation.id },
      },
    });

    return user;
  });
}
