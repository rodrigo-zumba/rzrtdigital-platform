"use server";

import { revalidatePath } from "next/cache";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { setReportStatusSchema } from "@/modules/reports/schemas/report.schemas";
import { setReportStatus } from "@/modules/reports/services/report.service";

export async function setReportStatusAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = setReportStatusSchema.safeParse({
    organizationId: formData.get("organizationId"),
    reportId: formData.get("reportId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError(parsed.error.issues[0]?.message ?? "Dados inválidos."));
  }

  const ctx = await requireRequestContext();

  try {
    await setReportStatus(ctx, parsed.data.organizationId, parsed.data.reportId, parsed.data.status);
  } catch (error) {
    return toErrorResponse(error);
  }

  revalidatePath(`/admin/clientes/${parsed.data.organizationId}/relatorios/${parsed.data.reportId}`);
  revalidatePath(`/portal/relatorios/${parsed.data.reportId}`);
  return { ok: true, data: undefined };
}
