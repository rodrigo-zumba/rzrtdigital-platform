"use server";

import { revalidatePath } from "next/cache";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { setTicketStatusSchema } from "@/modules/tickets/schemas/ticket.schemas";
import { setTicketStatus } from "@/modules/tickets/services/ticket.service";

export async function setTicketStatusAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = setTicketStatusSchema.safeParse({
    organizationId: formData.get("organizationId"),
    ticketId: formData.get("ticketId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError(parsed.error.issues[0]?.message ?? "Dados inválidos."));
  }

  const ctx = await requireRequestContext();

  try {
    await setTicketStatus(ctx, parsed.data.organizationId, parsed.data.ticketId, parsed.data.status);
  } catch (error) {
    return toErrorResponse(error);
  }

  revalidatePath(`/admin/clientes/${parsed.data.organizationId}/chamados/${parsed.data.ticketId}`);
  revalidatePath(`/portal/chamados/${parsed.data.ticketId}`);
  return { ok: true, data: undefined };
}
