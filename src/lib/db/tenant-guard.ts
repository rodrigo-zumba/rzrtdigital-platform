import {
  ORGANIZATION_FILTER_OPERATIONS,
  READ_FILTER_OPERATIONS,
  SOFT_DELETE_MODELS,
  TENANT_SCOPED_MODELS,
} from "./tenant-scoped-models";

export class MissingOrganizationFilterError extends Error {
  constructor(model: string, operation: string) {
    super(
      `Query bloqueada: ${model}.${operation} não tem "organizationId" no where. ` +
        `Todo repository de modelo tenant-scoped deve filtrar por organizationId derivado do RequestContext (CLAUDE.md §4.2).`,
    );
    this.name = "MissingOrganizationFilterError";
  }
}

type QueryArgs = { where?: Record<string, unknown> | null; [key: string]: unknown };

function isTenantScopedModel(model: string | undefined): boolean {
  return !!model && (TENANT_SCOPED_MODELS as readonly string[]).includes(model);
}

function isSoftDeleteModel(model: string | undefined): boolean {
  return !!model && (SOFT_DELETE_MODELS as readonly string[]).includes(model);
}

/**
 * Lança `MissingOrganizationFilterError` se a operação exige `where` e o
 * `where` não contém a chave `organizationId` (mesmo que o valor seja
 * `null`, para os modelos com organizationId opcional — presença da chave é
 * o que importa, não o valor).
 */
export function assertOrganizationFilterPresent(
  model: string | undefined,
  operation: string,
  args: QueryArgs | undefined,
): void {
  if (!isTenantScopedModel(model) || !ORGANIZATION_FILTER_OPERATIONS.has(operation)) {
    return;
  }

  const where = args?.where;
  if (!where || typeof where !== "object" || !("organizationId" in where)) {
    throw new MissingOrganizationFilterError(model as string, operation);
  }
}

/**
 * Para modelos com soft delete, injeta `deletedAt: null` no `where` de
 * operações de leitura em lote quando o chamador não decidiu explicitamente
 * (não passou a chave `deletedAt`). Não afeta leituras por id
 * (findUnique/findFirst por chave única), que continuam podendo enxergar
 * registros soft-deleted quando necessário (ex.: tela de restauração).
 */
export function withDefaultSoftDeleteFilter<T extends QueryArgs>(
  model: string | undefined,
  operation: string,
  args: T,
): T {
  if (!isSoftDeleteModel(model) || !READ_FILTER_OPERATIONS.has(operation)) {
    return args;
  }

  const where = args.where ?? {};
  if (typeof where === "object" && !("deletedAt" in where)) {
    return { ...args, where: { ...where, deletedAt: null } };
  }

  return args;
}
