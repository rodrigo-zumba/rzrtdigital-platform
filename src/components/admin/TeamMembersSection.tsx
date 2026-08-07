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
}: {
  organizationId: string;
  members: Awaited<ReturnType<typeof listOrganizationMembers>>;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-text-secondary">Equipe</h2>
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
                <th className="px-4 py-3 font-medium">Ações</th>
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
                    <MemberRoleForm organizationId={organizationId} userId={member.user.id} currentRole={member.role} />
                  </td>
                  <td className="px-4 py-3 text-text-primary">{MEMBER_STATUS_LABEL[member.status]}</td>
                  <td className="px-4 py-3">
                    <MemberRowActions
                      organizationId={organizationId}
                      userId={member.user.id}
                      status={member.status}
                      userName={member.user.name}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
