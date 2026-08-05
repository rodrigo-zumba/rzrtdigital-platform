import { redirect } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { requireRequestContext } from "@/lib/auth";
import { selectWorkspaceAction } from "@/modules/auth/actions/select-workspace.action";

export default async function SelectWorkspacePage() {
  const ctx = await requireRequestContext();
  if (ctx.kind !== "CLIENT") redirect("/admin");
  if (ctx.memberships.length <= 1) redirect("/portal");

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="surface-card w-full max-w-sm p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-text-primary">Selecione o workspace</h1>
          <LogoutButton />
        </div>
        <div className="flex flex-col gap-3">
          {ctx.memberships.map((membership) => (
            <form key={membership.organizationId} action={selectWorkspaceAction}>
              <input type="hidden" name="organizationId" value={membership.organizationId} />
              <Button type="submit" variant="secondary" className="w-full justify-between">
                <span>{membership.organizationName}</span>
                <span className="text-text-secondary">{membership.role}</span>
              </Button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
