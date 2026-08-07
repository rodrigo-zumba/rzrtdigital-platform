import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FileUploadForm } from "@/components/files/FileUploadForm";
import { FilesList } from "@/components/files/FilesList";
import { ForbiddenState } from "@/components/ui/ForbiddenState";
import { Pagination } from "@/components/ui/Pagination";
import { requireRequestContext } from "@/lib/auth";
import { getSelectedOrganizationId } from "@/lib/auth/workspace";
import { ForbiddenError } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { listFiles } from "@/modules/files/services/file.service";

export const metadata: Metadata = { title: "Arquivos" };

export default async function PortalArquivosPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const ctx = await requireRequestContext();
  if (ctx.kind !== "CLIENT") return null;

  const organizationId = await getSelectedOrganizationId(ctx);
  if (!organizationId) redirect("/selecionar-workspace");

  const { page } = await searchParams;
  const pageNumber = Number(page) > 0 ? Number(page) : 1;

  let result;
  try {
    result = await listFiles(ctx, organizationId, pageNumber);
  } catch (error) {
    if (error instanceof ForbiddenError) return <ForbiddenState />;
    throw error;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Arquivos</h1>
        <p className="mt-1 text-sm text-text-secondary">{result.total} arquivo(s).</p>
      </div>

      {hasPermission(ctx, "files.upload") && <FileUploadForm organizationId={organizationId} />}

      <FilesList organizationId={organizationId} files={result.items} canDelete={hasPermission(ctx, "files.delete")} />

      <Pagination page={result.page} pageCount={result.pageCount} basePath="/portal/arquivos" searchParams={{}} />
    </div>
  );
}
