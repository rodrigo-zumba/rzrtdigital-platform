import type { InternalRole, MemberRole } from "@prisma/client";

// docs/ESPECIFICACAO.md §4. Matriz estática, tipada. Não configurável em
// banco no v1 — permissão dinâmica é uma feature inteira, não um detalhe.
export const PERMISSIONS = [
  "organizations.create",
  "organizations.read",
  "organizations.update",
  "organizations.archive",
  "organizations.delete",
  "users.invite",
  "users.read",
  "users.update",
  "users.suspend",
  "users.remove",
  "assignments.manage",
  "projects.create",
  "projects.read",
  "projects.update",
  "projects.archive",
  "tasks.manage",
  "campaigns.create",
  "campaigns.read",
  "campaigns.update",
  "campaigns.archive",
  "metrics.write",
  "metrics.read",
  "reports.create",
  "reports.read",
  "reports.publish",
  "reports.archive",
  "files.upload",
  "files.download",
  "files.delete",
  "tickets.create",
  "tickets.read",
  "tickets.respond",
  "tickets.manage",
  "tickets.internalNotes",
  "notifications.read",
  "settings.manage",
  "settings.global.manage",
  "auditLogs.read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL_PERMISSIONS: readonly Permission[] = PERMISSIONS;

/**
 * ADMIN: operação completa, exceto o que é exclusivo de SUPER_ADMIN
 * (configurações globais, exclusão de organização, leitura de audit log —
 * docs/ESPECIFICACAO.md §3).
 */
const ADMIN_PERMISSIONS: readonly Permission[] = PERMISSIONS.filter(
  (permission) =>
    permission !== "organizations.delete" &&
    permission !== "settings.global.manage" &&
    permission !== "auditLogs.read",
);

/** MANAGER: gerencia o que é da carteira dele (escopo em OrganizationAssignment). */
const MANAGER_PERMISSIONS: readonly Permission[] = [
  "users.read",
  "projects.create",
  "projects.read",
  "projects.update",
  "projects.archive",
  "tasks.manage",
  "campaigns.create",
  "campaigns.read",
  "campaigns.update",
  "campaigns.archive",
  "metrics.write",
  "metrics.read",
  "reports.create",
  "reports.read",
  "reports.publish",
  "reports.archive",
  "files.upload",
  "files.download",
  "files.delete",
  "tickets.create",
  "tickets.read",
  "tickets.respond",
  "tickets.manage",
  "tickets.internalNotes",
  "notifications.read",
];

/** ANALYST: atualiza métricas, cria relatório em rascunho, sobe arquivo, atualiza tarefa. */
const ANALYST_PERMISSIONS: readonly Permission[] = [
  "projects.read",
  "tasks.manage",
  "campaigns.read",
  "metrics.write",
  "metrics.read",
  "reports.create",
  "reports.read",
  "files.upload",
  "files.download",
  "tickets.read",
  "notifications.read",
];

export const INTERNAL_ROLE_PERMISSIONS: Record<InternalRole, readonly Permission[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
  MANAGER: MANAGER_PERMISSIONS,
  ANALYST: ANALYST_PERMISSIONS,
};

/** CLIENT_ADMIN: tudo da própria org + convidar/remover membros. */
const CLIENT_ADMIN_PERMISSIONS: readonly Permission[] = [
  "users.invite",
  "users.read",
  "users.remove",
  "projects.read",
  "campaigns.read",
  "metrics.read",
  "reports.read",
  "files.upload",
  "files.download",
  "tickets.create",
  "tickets.read",
  "tickets.respond",
  "notifications.read",
];

/** CLIENT_MEMBER: dashboards/projetos/campanhas permitidos, download, chamados. */
const CLIENT_MEMBER_PERMISSIONS: readonly Permission[] = [
  "projects.read",
  "campaigns.read",
  "metrics.read",
  "reports.read",
  "files.download",
  "tickets.create",
  "tickets.read",
  "tickets.respond",
  "notifications.read",
];

/** CLIENT_VIEWER: somente leitura + download do que foi liberado. */
const CLIENT_VIEWER_PERMISSIONS: readonly Permission[] = [
  "projects.read",
  "campaigns.read",
  "metrics.read",
  "reports.read",
  "files.download",
  "tickets.read",
  "notifications.read",
];

export const CLIENT_ROLE_PERMISSIONS: Record<MemberRole, readonly Permission[]> = {
  CLIENT_ADMIN: CLIENT_ADMIN_PERMISSIONS,
  CLIENT_MEMBER: CLIENT_MEMBER_PERMISSIONS,
  CLIENT_VIEWER: CLIENT_VIEWER_PERMISSIONS,
};
