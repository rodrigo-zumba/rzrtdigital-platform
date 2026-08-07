"use server";

import { redirect } from "next/navigation";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { archiveReportSchema } from "@/modules/reports/schemas/report.schemas";
import { archiveReport } from "@/modules/reports/services/report.service";

export async function archiveReportAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = archiveReportSchema.safeParse({
    organizationId: formData.get("organizationId"),
    reportId: formData.get("reportId"),
  });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError("Dados inválidos."));
  }

  const ctx = await requireRequestContext();

  try {
    await archiveReport(ctx, parsed.data.organizationId, parsed.data.reportId);
  } catch (error) {
    return toErrorResponse(error);
  }

  redirect(`/admin/clientes/${parsed.data.organizationId}/relatorios`);
}
