import { z } from "zod";

export const listAuditLogsSchema = z.object({
  organizationId: z.string().min(1).optional(),
  action: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
});
export type ListAuditLogsInput = z.infer<typeof listAuditLogsSchema>;
