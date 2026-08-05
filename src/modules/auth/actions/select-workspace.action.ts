"use server";

import { redirect } from "next/navigation";

import { requireRequestContext } from "@/lib/auth/request-context";
import { setSelectedOrganizationId } from "@/lib/auth/workspace";
import { ForbiddenError } from "@/lib/errors";

export async function selectWorkspaceAction(formData: FormData): Promise<void> {
  const organizationId = formData.get("organizationId");
  const ctx = await requireRequestContext();

  if (
    ctx.kind !== "CLIENT" ||
    typeof organizationId !== "string" ||
    !ctx.memberships.some((membership) => membership.organizationId === organizationId)
  ) {
    throw new ForbiddenError();
  }

  await setSelectedOrganizationId(organizationId);
  redirect("/portal");
}
