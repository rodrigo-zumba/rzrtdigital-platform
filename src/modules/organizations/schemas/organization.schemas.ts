import { z } from "zod";

import { slugSchema } from "@/lib/validation/reserved-slugs";

// Sem .transform(): campo ausente/"" fica como undefined, e o caller decide
// se isso significa "não alterar" (create) ou "limpar" (update — vira null
// explícito no service, para não cair no comportamento do Prisma de ignorar
// chave `undefined` em `update`).
const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined));

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do cliente.").max(120),
  slug: slugSchema,
  legalName: optionalTrimmed(160),
  document: optionalTrimmed(32),
  website: optionalTrimmed(200),
  phone: optionalTrimmed(32),
  segment: optionalTrimmed(80),
});
export type CreateOrganizationInput = z.input<typeof createOrganizationSchema>;
export type CreateOrganizationOutput = z.output<typeof createOrganizationSchema>;

export const updateOrganizationSchema = createOrganizationSchema.extend({
  organizationId: z.string().min(1),
});
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

export const organizationStatusValues = ["ONBOARDING", "ACTIVE", "SUSPENDED", "ARCHIVED"] as const;

export const changeOrganizationStatusSchema = z.object({
  organizationId: z.string().min(1),
  status: z.enum(organizationStatusValues),
});
export type ChangeOrganizationStatusInput = z.infer<typeof changeOrganizationStatusSchema>;

export const deleteOrganizationSchema = z.object({
  organizationId: z.string().min(1),
});
export type DeleteOrganizationInput = z.infer<typeof deleteOrganizationSchema>;

export const listOrganizationsSchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(organizationStatusValues).optional(),
  page: z.coerce.number().int().min(1).default(1),
});
export type ListOrganizationsInput = z.infer<typeof listOrganizationsSchema>;
