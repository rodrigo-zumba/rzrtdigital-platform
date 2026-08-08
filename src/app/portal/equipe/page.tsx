import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { TeamMembersSection } from "@/components/admin/TeamMembersSection";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { requireRequestContext } from "@/lib/auth";
import { getSelectedOrganizationId } from "@/lib/auth/workspace";
import { ForbiddenError } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { listOrganizationMembers } from "@/modules/users/services/user.service";

export const metadata: Metadata = { title: "Equipe" };

export default async function EquipePage() {
  const ctx = await requireRequestContext();
  if (ctx.kind !== "CLIENT") return null;

  const organizationId = await getSelectedOrganizationId(ctx);
  if (!organizationId) redirect("/selecionar-workspace");

  let members;
  try {
    members = await listOrganizationMembers(ctx, organizationId);
  } catch (error) {
    if (error instanceof ForbiddenError) return <ForbiddenState />;
    throw error;
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-xl font-semibold text-text-primary">Equipe</h1>
      <TeamMembersSection
        organizationId={organizationId}
        members={members}
        canEditRole={hasPermission(ctx, "users.update", organizationId)}
        canSuspend={hasPermission(ctx, "users.suspend", organizationId)}
        canRemove={hasPermission(ctx, "users.remove", organizationId)}
        canInvite={hasPermission(ctx, "users.invite", organizationId)}
        title="Membros da organização"
      />
    </div>
  );
}
