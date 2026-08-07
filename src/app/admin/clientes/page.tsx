import type { OrganizationStatus } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";

import { OrganizationsTable } from "@/components/admin/OrganizationsTable";
import { Button } from "@/components/ui/Button";
import { requireRequestContext } from "@/lib/auth";
import { listOrganizationsSchema } from "@/modules/organizations/schemas/organization.schemas";
import { listOrganizations } from "@/modules/organizations/services/organization.service";

export const metadata: Metadata = { title: "Clientes" };

const STATUS_OPTIONS: { value: OrganizationStatus; label: string }[] = [
  { value: "ONBOARDING", label: "Onboarding" },
  { value: "ACTIVE", label: "Ativo" },
  { value: "SUSPENDED", label: "Suspenso" },
  { value: "ARCHIVED", label: "Arquivado" },
];

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const rawParams = await searchParams;
  const parsed = listOrganizationsSchema.safeParse(rawParams);
  const params = parsed.success ? parsed.data : { page: 1 };

  const ctx = await requireRequestContext();
  const result = await listOrganizations(ctx, params);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Clientes</h1>
          <p className="mt-1 text-sm text-text-secondary">{result.total} cliente(s) cadastrado(s).</p>
        </div>
        <Link
          href="/admin/clientes/novo"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue px-5 py-2.5 text-sm font-semibold text-text-primary shadow-[var(--shadow-glow)] transition-all duration-[var(--duration-base)] ease-[var(--ease-standard)] hover:-translate-y-0.5 hover:brightness-110"
        >
          Novo cliente
        </Link>
      </div>

      <form className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="q" className="text-sm font-medium text-text-secondary">
            Buscar
          </label>
          <input
            id="q"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Nome, identificador ou documento"
            className="min-h-[44px] rounded-[var(--radius-md)] border border-border-strong bg-surface/60 px-4 py-2.5 text-sm text-text-primary outline-none focus-visible:border-blue-light"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className="text-sm font-medium text-text-secondary">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={params.status ?? ""}
            className="min-h-[44px] rounded-[var(--radius-md)] border border-border-strong bg-surface/60 px-4 py-2.5 text-sm text-text-primary outline-none focus-visible:border-blue-light"
          >
            <option value="">Todos</option>
            {STATUS_OPTIONS.map((option) => (
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

      <OrganizationsTable organizations={result.items} />

      {result.pageCount > 1 && (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          {Array.from({ length: result.pageCount }, (_, index) => index + 1).map((page) => {
            const search = new URLSearchParams();
            if (params.q) search.set("q", params.q);
            if (params.status) search.set("status", params.status);
            search.set("page", String(page));

            return (
              <Link
                key={page}
                href={`/admin/clientes?${search.toString()}`}
                className={page === result.page ? "font-semibold text-blue-light" : "hover:text-blue-light"}
              >
                {page}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
