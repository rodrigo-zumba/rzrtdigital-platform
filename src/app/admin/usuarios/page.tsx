import type { InternalRole } from "@prisma/client";
import type { Metadata } from "next";

import { InternalRoleForm } from "@/components/admin/InternalRoleForm";
import { UserStatusActions } from "@/components/admin/UserStatusActions";
import { InviteInternalUserForm } from "@/components/forms/InviteInternalUserForm";
import { Button } from "@/components/ui/Button";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { Pagination } from "@/components/ui/Pagination";
import { requireRequestContext } from "@/lib/auth";
import { ForbiddenError } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { listInternalUsersSchema } from "@/modules/users/schemas/user.schemas";
import { listInternalUsers } from "@/modules/users/services/user.service";

export const metadata: Metadata = { title: "Usuários" };

const ROLE_OPTIONS: { value: InternalRole; label: string }[] = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "ANALYST", label: "Analyst" },
];

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>;
}) {
  const rawParams = await searchParams;
  const parsed = listInternalUsersSchema.safeParse(rawParams);
  const params = parsed.success ? parsed.data : { page: 1 };

  const ctx = await requireRequestContext();

  let result;
  try {
    result = await listInternalUsers(ctx, params);
  } catch (error) {
    if (error instanceof ForbiddenError) return <ForbiddenState />;
    throw error;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Usuários internos</h1>
        <p className="mt-1 text-sm text-text-secondary">{result.total} usuário(s) cadastrado(s).</p>
      </div>

      {hasPermission(ctx, "users.invite") && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-text-secondary">Convidar usuário</h2>
          <InviteInternalUserForm />
        </section>
      )}

      <form className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="q" className="text-sm font-medium text-text-secondary">
            Buscar
          </label>
          <input
            id="q"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Nome ou e-mail"
            className="min-h-[44px] rounded-[var(--radius-md)] border border-border-strong bg-surface/60 px-4 py-2.5 text-sm text-text-primary outline-none focus-visible:border-blue-light"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="role" className="text-sm font-medium text-text-secondary">
            Papel
          </label>
          <select
            id="role"
            name="role"
            defaultValue={params.role ?? ""}
            className="min-h-[44px] rounded-[var(--radius-md)] border border-border-strong bg-surface/60 px-4 py-2.5 text-sm text-text-primary outline-none focus-visible:border-blue-light"
          >
            <option value="">Todos</option>
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>

      {result.items.length === 0 ? (
        <div className="surface-card p-6 text-sm text-text-secondary">Nenhum usuário encontrado.</div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-surface/60 text-text-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Papel</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Criado em</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-surface-hover/60">
                  <td className="px-4 py-3 font-medium text-text-primary">{user.name}</td>
                  <td className="px-4 py-3 text-text-secondary">{user.email}</td>
                  <td className="px-4 py-3">
                    {user.internalProfile && (
                      <InternalRoleForm userId={user.id} currentRole={user.internalProfile.internalRole} />
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-primary">{user.status === "ACTIVE" ? "Ativo" : "Suspenso"}</td>
                  <td className="px-4 py-3 text-text-secondary">{dateFormatter.format(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    <UserStatusActions userId={user.id} status={user.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        basePath="/admin/usuarios"
        searchParams={{ q: params.q, role: params.role }}
      />
    </div>
  );
}
