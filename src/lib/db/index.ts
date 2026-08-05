import { Prisma } from "@prisma/client";

import { prismaBase } from "./client";
import { assertOrganizationFilterPresent, withDefaultSoftDeleteFilter } from "./tenant-guard";

/**
 * Único ponto de acesso ao Prisma (docs/ESPECIFICACAO.md §2). Bloqueado por
 * ESLint (`no-restricted-imports`) fora de src/modules/*\/repositories/.
 *
 * Rede de segurança: para modelos tenant-scoped, exige `organizationId` no
 * `where` (lança em runtime se ausente) e aplica o filtro de soft delete por
 * padrão. Isso não substitui `assertOrganizationAccess(ctx, organizationId)`
 * no service — é a última linha de defesa contra um `where` esquecido.
 */
const tenantGuardExtension = Prisma.defineExtension({
  name: "tenant-guard",
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        assertOrganizationFilterPresent(model, operation, args as { where?: Record<string, unknown> });
        const guardedArgs = withDefaultSoftDeleteFilter(model, operation, args);
        return query(guardedArgs);
      },
    },
  },
});

export const db = prismaBase.$extends(tenantGuardExtension);
