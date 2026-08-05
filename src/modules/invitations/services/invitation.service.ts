import type { MemberRole } from "@prisma/client";

import { hashPassword } from "@/lib/auth/password";
import type { RequestContext } from "@/lib/auth/types";
import { env } from "@/lib/env";
import { invitationEmail, sendEmail } from "@/lib/email";
import { AppError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { assertOrganizationAccess, requirePermission } from "@/lib/permissions";
import { generateToken, hashToken, INVITATION_EXPIRATION_MS } from "@/lib/security/tokens";
import { createAuditLog } from "@/modules/audit/repositories/audit-log.repository";
import {
  acceptInvitationTransaction,
  createInvitation,
  findByTokenHash,
  findPendingByEmailAndOrganization,
  markAccepted,
  revokeInvitation,
} from "@/modules/invitations/repositories/invitation.repository";
import { findById as findOrganizationById } from "@/modules/organizations/repositories/organization.repository";
import { findByEmail } from "@/modules/users/repositories/user.repository";

/**
 * Convite de CLIENT para uma organização. Só um PENDING por (email, org) —
 * revoga o anterior ao reenviar (docs/ESPECIFICACAO.md §5, modelo Invitation).
 * Sem página/action pública nesta fase — CRUD de usuários é Fase 2; esta
 * função existe para o ciclo de vida do convite (aceite) ser testável.
 */
export async function inviteClientToOrganization(
  ctx: RequestContext,
  params: { email: string; organizationId: string; role: MemberRole },
) {
  requirePermission(ctx, "users.invite");
  assertOrganizationAccess(ctx, params.organizationId);

  const organization = await findOrganizationById(params.organizationId);
  if (!organization) throw new NotFoundError("Organização não encontrada.");

  const email = params.email.trim().toLowerCase();

  const existing = await findPendingByEmailAndOrganization(email, params.organizationId);
  if (existing) await revokeInvitation(existing.id, existing.organizationId);

  const { token, tokenHash } = generateToken();
  const invitation = await createInvitation({
    email,
    organizationId: params.organizationId,
    targetType: "CLIENT",
    role: params.role,
    tokenHash,
    invitedById: ctx.userId,
    expiresAt: new Date(Date.now() + INVITATION_EXPIRATION_MS),
  });

  await sendEmail({
    to: email,
    ...invitationEmail({
      inviterName: ctx.name,
      acceptUrl: `${env.APP_URL}/convite/${token}`,
      organizationName: organization.name,
    }),
  });

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId: params.organizationId,
    action: "invitation.create",
    entityType: "Invitation",
    entityId: invitation.id,
    metadata: { email, role: params.role },
  });

  return invitation;
}

export type InvitationPreview =
  | { valid: true; email: string; organizationName: string | null }
  | { valid: false; reason: string };

/** Usado pela página /convite/[token] para decidir o que renderizar, sem expor o hash do token. */
export async function previewInvitation(token: string): Promise<InvitationPreview> {
  const tokenHash = hashToken(token);
  const invitation = await findByTokenHash(tokenHash);

  if (!invitation || invitation.status !== "PENDING") {
    return { valid: false, reason: "Convite inválido, expirado ou já utilizado." };
  }
  if (invitation.expiresAt.getTime() < Date.now()) {
    return { valid: false, reason: "Convite expirado." };
  }

  const organization = invitation.organizationId
    ? await findOrganizationById(invitation.organizationId)
    : null;

  return { valid: true, email: invitation.email, organizationName: organization?.name ?? null };
}

export async function acceptInvitation(params: { token: string; name?: string; password: string }) {
  const tokenHash = hashToken(params.token);
  const invitation = await findByTokenHash(tokenHash);

  if (!invitation || invitation.status !== "PENDING") {
    throw new ValidationError("Convite inválido, expirado ou já utilizado.");
  }

  if (invitation.expiresAt.getTime() < Date.now()) {
    throw new ValidationError("Convite expirado.");
  }

  const existingUser = await findByEmail(invitation.email);
  if (existingUser) {
    throw new AppError("USER_ALREADY_EXISTS", "Já existe uma conta com este e-mail. Faça login.", 409);
  }

  if (invitation.targetType === "CLIENT" && !invitation.organizationId) {
    // Estado inconsistente: nunca deveria existir (invariante do modelo).
    throw new ForbiddenError();
  }

  const passwordHash = await hashPassword(params.password);
  const name = params.name?.trim() || invitation.email.split("@")[0] || invitation.email;

  const user = await acceptInvitationTransaction(invitation, { name, passwordHash });

  await markAccepted(invitation.id, invitation.organizationId);

  return user;
}
