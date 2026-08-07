"use server";

import { redirect } from "next/navigation";

import { requireRequestContext } from "@/lib/auth";
import { type ActionResult, ValidationError, toErrorResponse } from "@/lib/errors";
import { createReportSchema } from "@/modules/reports/schemas/report.schemas";
import { createReport } from "@/modules/reports/services/report.service";

export async function createReportAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = createReportSchema.safeParse({
    organizationId: formData.get("organizationId"),
    title: formData.get("title"),
    description: formData.get("description"),
    periodStart: formData.get("periodStart"),
    periodEnd: formData.get("periodEnd"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return toErrorResponse(new ValidationError(parsed.error.issues[0]?.message ?? "Dados inválidos."));
  }

  const ctx = await requireRequestContext();
  const { organizationId, periodStart, periodEnd, ...input } = parsed.data;

  let reportId: string;
  try {
    const report = await createReport(ctx, organizationId, {
      ...input,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
    });
    reportId = report.id;
  } catch (error) {
    return toErrorResponse(error);
  }

  redirect(`/admin/clientes/${organizationId}/relatorios/${reportId}`);
}
