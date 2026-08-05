/**
 * Modelos com `organizationId` como coluna própria — a extensão de tenant
 * guard (client.ts) exige essa chave no `where` de toda leitura/escrita
 * filtrada. Nomes exatamente como declarados no schema.prisma (PascalCase)
 * — é esse o valor de `model` recebido pelo hook `$allOperations` da
 * extensão, não o nome do accessor do client (lowerCamel).
 *
 * Fora desta lista, propositalmente: User (atravessa tenants), e modelos que
 * derivam o tenant de uma relação (Task, TicketMessage, ProjectMember,
 * CampaignMetric, InternalUserProfile, PasswordResetToken, Account, Session,
 * VerificationToken) — o repository é responsável por validar o tenant via
 * join (docs/ESPECIFICACAO.md §5, nota do modelo Task).
 */
export const TENANT_SCOPED_MODELS = [
  "OrganizationMember",
  "OrganizationAssignment",
  "Invitation",
  "Project",
  "Campaign",
  "Report",
  "File",
  "Ticket",
  "Notification",
  "AuditLog",
  "Activity",
  "Setting",
] as const;

/** Modelos com soft delete (`deletedAt`) — filtrado por padrão nas leituras. */
export const SOFT_DELETE_MODELS = ["Organization", "Project", "Campaign", "Report", "File", "Ticket"] as const;

export type TenantScopedModel = (typeof TENANT_SCOPED_MODELS)[number];
export type SoftDeleteModel = (typeof SOFT_DELETE_MODELS)[number];

/** Operações cujo `where` runtime aceita (e por isso exige) `organizationId`. */
export const ORGANIZATION_FILTER_OPERATIONS = new Set([
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "updateMany",
  "deleteMany",
  "count",
  "aggregate",
  "groupBy",
  "upsert",
  "update",
  "delete",
]);

/**
 * `findUnique`/`findUniqueOrThrow` ficam fora do guard: o `where` deles só
 * aceita campos únicos (id, ou uma unique composta), então não há como
 * exigir `organizationId` ali. Nesses casos o repository DEVE usar
 * `findFirst({ where: { id, organizationId } })` para lookup por id em
 * modelo tenant-scoped, ou validar `result.organizationId` explicitamente
 * contra o `ctx` depois do lookup (ex.: lookup por token único).
 */
export const READ_FILTER_OPERATIONS = new Set([
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
]);
