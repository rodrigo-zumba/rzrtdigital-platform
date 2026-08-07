import type { Metadata } from "next";
import Link from "next/link";

import { ProjectsTable } from "@/components/projects/ProjectsTable";
import { Button } from "@/components/ui/Button";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { Pagination } from "@/components/ui/Pagination";
import { requireRequestContext } from "@/lib/auth";
import { ForbiddenError } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { listProjects } from "@/modules/projects/services/project.service";

export const metadata: Metadata = { title: "Projetos" };

export default async function AdminProjetosPage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { organizationId } = await params;
  const { page } = await searchParams;
  const pageNumber = Number(page) > 0 ? Number(page) : 1;

  const ctx = await requireRequestContext();

  let result;
  try {
    result = await listProjects(ctx, organizationId, pageNumber);
  } catch (error) {
    if (error instanceof ForbiddenError) return <ForbiddenState />;
    throw error;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Projetos</h1>
          <p className="mt-1 text-sm text-text-secondary">{result.total} projeto(s).</p>
        </div>
        {hasPermission(ctx, "projects.create") && (
          <Link href={`/admin/clientes/${organizationId}/projetos/novo`}>
            <Button>Novo projeto</Button>
          </Link>
        )}
      </div>

      <ProjectsTable projects={result.items} basePath={`/admin/clientes/${organizationId}/projetos`} />

      <Pagination page={result.page} pageCount={result.pageCount} basePath={`/admin/clientes/${organizationId}/projetos`} searchParams={{}} />
    </div>
  );
}
