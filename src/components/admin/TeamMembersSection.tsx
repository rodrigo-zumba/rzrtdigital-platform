import { InviteMemberForm } from "@/components/forms/InviteMemberForm";
import { MemberRoleForm } from "@/components/admin/MemberRoleForm";
import { MemberRowActions } from "@/components/admin/MemberRowActions";
import type { listOrganizationMembers } from "@/modules/users/services/user.service";

const MEMBER_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  ACTIVE: "Ativo",
  SUSPENDED: "Suspenso",
};

export function TeamMembersSection({
  organizationId,
  members,
  canEditRole = true,
  canSuspend = true,
  canRemove = true,
  canInvite = false,
  title = "Equipe",
}: {
  organizationId: string;
  members: Awaited<ReturnType<typeof listOrganizationMembers>>;
  canEditRole?: boolean;
  canSuspend?: boolean;
  canRemove?: boolean;
  canInvite?: boolean;
  title?: string;
}) {
  const showActionsColumn = canSuspend || canRemove;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-text-secondary">{title}</h2>
      {members.length === 0 ? (
        <p className="text-sm text-text-secondary">Nenhum membro nesta organização ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-border bg-surface/60 text-text-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Papel</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {showActionsColumn && <th className="px-4 py-3 font-medium">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-primary">{member.user.name}</p>
                    <p className="text-xs text-text-secondary">{member.user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {canEditRole ? (
                      <MemberRoleForm organizationId={organizationId} userId={member.user.id} currentRole={member.role} />
                    ) : (
                      <span className="text-text-secondary">{member.role}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-primary">{MEMBER_STATUS_LABEL[member.status]}</td>
                  {showActionsColumn && (
                    <td className="px-4 py-3">
                      <MemberRowActions
                        organizationId={organizationId}
                        userId={member.user.id}
                        status={member.status}
                        userName={member.user.name}
                        canSuspend={canSuspend}
                        canRemove={canRemove}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canInvite && <InviteMemberForm organizationId={organizationId} />}
    </section>
  );
}
