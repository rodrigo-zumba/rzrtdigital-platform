import type { InternalRole, MemberRole } from "@prisma/client";

import { hashPassword } from "@/lib/auth/password";
import type { RequestContext } from "@/lib/auth/types";
import { env } from "@/lib/env";
import { invitationEmail, sendEmail } from "@/lib/email";
import { AppError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { assertOrganizationAccess, canGrantInternalRole, requirePermission } from "@/lib/permissions";
import { checkRateLimit, invitationRateLimitByIp, invitationRateLimitByToken } from "@/lib/security/rate-limit";
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
 */
export async function inviteClientToOrganization(
  ctx: RequestContext,
  params: { email: string; organizationId: string; role: MemberRole },
) {
  requirePermission(ctx, "users.invite", params.organizationId);
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

/**
 * Convite de um novo INTERNAL (ADMIN/MANAGER/ANALYST). SUPER_ADMIN nunca é
 * concedido por convite — só via `pnpm create-superadmin`
 * (docs/ESPECIFICACAO.md §15.4). Guard de escalada de privilégio: quem
 * convida nunca convida para um papel igual ou superior ao seu.
 */
export async function inviteInternalUser(ctx: RequestContext, params: { email: string; role: InternalRole }) {
  requirePermission(ctx, "users.invite");
  if (!canGrantInternalRole(ctx, params.role)) throw new ForbiddenError();

  const email = params.email.trim().toLowerCase();

  const existing = await findPendingByEmailAndOrganization(email, null);
  if (existing) await revokeInvitation(existing.id, existing.organizationId);

  const { token, tokenHash } = generateToken();
  const invitation = await createInvitation({
    email,
    organizationId: null,
    targetType: "INTERNAL",
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
    }),
  });

  await createAuditLog({
    actorUserId: ctx.userId,
    organizationId: null,
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

/**
 * Usado pela página /convite/[token] para decidir o que renderizar, sem
 * expor o hash do token. `token` de 32 bytes é praticamente impossível de
 * adivinhar, mas a única defesa contra tentativa de força bruta é rate
 * limit — por IP (muitos tokens diferentes tentados) e por token (muitas
 * tentativas contra o mesmo alvo). Igual ao login/reset de senha
 * (CLAUDE.md §4.7), a resposta de rate limit excedido é a mesma mensagem
 * genérica de "inválido" — não revela que o limite foi atingido.
 */
export async function previewInvitation(token: string, ip: string): Promise<InvitationPreview> {
  const tokenHash = hashToken(token);

  const [ipAllowed, tokenAllowed] = await Promise.all([
    checkRateLimit(invitationRateLimitByIp, ip),
    checkRateLimit(invitationRateLimitByToken, tokenHash),
  ]);
  if (!ipAllowed || !tokenAllowed) {
    return { valid: false, reason: "Convite inválido, expirado ou já utilizado." };
  }

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

export async function acceptInvitation(params: { token: string; name?: string; password: string; ip: string }) {
  const tokenHash = hashToken(params.token);

  const [ipAllowed, tokenAllowed] = await Promise.all([
    checkRateLimit(invitationRateLimitByIp, params.ip),
    checkRateLimit(invitationRateLimitByToken, tokenHash),
  ]);
  if (!ipAllowed || !tokenAllowed) {
    throw new ValidationError("Convite inválido, expirado ou já utilizado.");
  }

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
