"use server";

import { revalidatePath } from "next/cache";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { addTicketMessageSchema } from "@/modules/tickets/schemas/ticket.schemas";
import { addTicketMessage } from "@/modules/tickets/services/ticket.service";

export async function addTicketMessageAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = addTicketMessageSchema.safeParse({
    organizationId: formData.get("organizationId"),
    ticketId: formData.get("ticketId"),
    message: formData.get("message"),
    isInternal: formData.get("isInternal"),
  });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError(parsed.error.issues[0]?.message ?? "Dados inválidos."));
  }

  const ctx = await requireRequestContext();

  try {
    await addTicketMessage(ctx, parsed.data.organizationId, parsed.data.ticketId, parsed.data.message, parsed.data.isInternal);
  } catch (error) {
    return toErrorResponse(error);
  }

  revalidatePath(`/admin/clientes/${parsed.data.organizationId}/chamados/${parsed.data.ticketId}`);
  revalidatePath(`/portal/chamados/${parsed.data.ticketId}`);
  return { ok: true, data: undefined };
}
