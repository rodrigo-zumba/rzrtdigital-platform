import { z } from "zod";

export const reportStatusValues = ["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"] as const;

export const createReportSchema = z.object({
  organizationId: z.string().min(1),
  title: z.string().trim().min(2, "Informe o título.").max(200),
  // .nullish() (não .optional()) porque não há campo "description" no
  // formulário — formData.get() retorna `null` para chave ausente, que
  // .optional() (só aceita undefined) rejeitaria.
  description: z
    .string()
    .trim()
    .max(2000)
    .nullish()
    .transform((value) => (value ? value : undefined)),
  periodStart: z.string().trim().min(1, "Informe o início do período."),
  periodEnd: z.string().trim().min(1, "Informe o fim do período."),
  content: z.string().trim().min(1, "Informe o conteúdo do relatório."),
});
export type CreateReportInput = z.infer<typeof createReportSchema>;

export const setReportStatusSchema = z.object({
  organizationId: z.string().min(1),
  reportId: z.string().min(1),
  status: z.enum(reportStatusValues),
});
export type SetReportStatusInput = z.infer<typeof setReportStatusSchema>;

export const archiveReportSchema = z.object({
  organizationId: z.string().min(1),
  reportId: z.string().min(1),
});
export type ArchiveReportInput = z.infer<typeof archiveReportSchema>;
