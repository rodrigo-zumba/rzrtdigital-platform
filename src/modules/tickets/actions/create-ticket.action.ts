"use server";

import { redirect } from "next/navigation";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { createTicketSchema } from "@/modules/tickets/schemas/ticket.schemas";
import { createTicket } from "@/modules/tickets/services/ticket.service";

export async function createTicketAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = createTicketSchema.safeParse({
    organizationId: formData.get("organizationId"),
    subject: formData.get("subject"),
    description: formData.get("description"),
    category: formData.get("category"),
    priority: formData.get("priority"),
  });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError(parsed.error.issues[0]?.message ?? "Dados inválidos."));
  }

  const ctx = await requireRequestContext();
  const { organizationId, ...input } = parsed.data;

  let ticketId: string;
  try {
    const ticket = await createTicket(ctx, organizationId, input);
    ticketId = ticket.id;
  } catch (error) {
    return toErrorResponse(error);
  }

  const basePath = ctx.kind === "INTERNAL" ? `/admin/clientes/${organizationId}` : "/portal";
  redirect(`${basePath}/chamados/${ticketId}`);
}
