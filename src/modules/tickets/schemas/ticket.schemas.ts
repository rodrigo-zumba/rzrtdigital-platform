import { z } from "zod";

export const ticketCategoryValues = ["TECHNICAL", "BILLING", "PROJECT", "CAMPAIGN", "GENERAL", "OTHER"] as const;
export const ticketPriorityValues = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const ticketStatusValues = ["OPEN", "IN_PROGRESS", "WAITING_CLIENT", "RESOLVED", "CLOSED"] as const;

export const createTicketSchema = z.object({
  organizationId: z.string().min(1),
  subject: z.string().trim().min(2, "Informe o assunto.").max(200),
  description: z.string().trim().min(2, "Descreva o chamado.").max(4000),
  category: z.enum(ticketCategoryValues),
  priority: z.enum(ticketPriorityValues),
});
export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const setTicketStatusSchema = z.object({
  organizationId: z.string().min(1),
  ticketId: z.string().min(1),
  status: z.enum(ticketStatusValues),
});
export type SetTicketStatusInput = z.infer<typeof setTicketStatusSchema>;

export const addTicketMessageSchema = z.object({
  organizationId: z.string().min(1),
  ticketId: z.string().min(1),
  message: z.string().trim().min(1, "Escreva uma mensagem.").max(4000),
  isInternal: z.coerce.boolean().optional().default(false),
});
export type AddTicketMessageInput = z.infer<typeof addTicketMessageSchema>;
