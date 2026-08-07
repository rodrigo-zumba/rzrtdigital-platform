"use client";

import type { File as FileRecord } from "@prisma/client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { ActionResult } from "@/lib/errors";
import { deleteFileAction } from "@/modules/files/actions/delete-file.action";
import { downloadFileAction } from "@/modules/files/actions/download-file.action";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilesList({
  organizationId,
  files,
  canDelete,
}: {
  organizationId: string;
  files: FileRecord[];
  canDelete: boolean;
}) {
  if (files.length === 0) {
    return <div className="surface-card p-6 text-sm text-text-secondary">Nenhum arquivo enviado ainda.</div>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {files.map((file) => (
        <li
          key={file.id}
          className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-border bg-surface/40 px-4 py-3"
        >
          <div>
            <p className="text-sm font-medium text-text-primary">{file.originalName}</p>
            <p className="text-xs text-text-secondary">
              {formatSize(file.size)} · {dateFormatter.format(file.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DownloadButton organizationId={organizationId} fileId={file.id} />
            {canDelete && <DeleteForm organizationId={organizationId} fileId={file.id} />}
          </div>
        </li>
      ))}
    </ul>
  );
}

function DownloadButton({ organizationId, fileId }: { organizationId: string; fileId: string }) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const result = await downloadFileAction(organizationId, fileId);
    setPending(false);
    if (result.ok) window.open(result.data.url, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-[var(--radius-sm)] border border-border-strong bg-surface/60 px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-hover disabled:opacity-60"
    >
      {pending ? "Gerando link..." : "Baixar"}
    </button>
  );
}

function DeleteForm({ organizationId, fileId }: { organizationId: string; fileId: string }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(deleteFileAction, null);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="fileId" value={fileId} />
      <DeleteButton />
      {state && !state.ok && <span className="text-xs text-danger">{state.error.message}</span>}
    </form>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-[var(--radius-sm)] border border-danger/40 bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/20 disabled:opacity-60"
    >
      Excluir
    </button>
  );
}
