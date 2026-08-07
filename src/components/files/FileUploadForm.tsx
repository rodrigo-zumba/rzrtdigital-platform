"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { confirmUploadAction } from "@/modules/files/actions/confirm-upload.action";
import { requestUploadAction } from "@/modules/files/actions/request-upload.action";

/**
 * Upload em 3 passos, nenhum deles passando o arquivo pelo nosso servidor
 * (CLAUDE.md §2): 1) pede uma URL assinada, 2) PUT direto pro bucket,
 * 3) confirma no banco.
 */
export function FileUploadForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setError(null);

    const requested = await requestUploadAction(organizationId, file.name, file.type || "application/octet-stream", file.size);
    if (!requested.ok) {
      setStatus("error");
      setError(requested.error.message);
      return;
    }

    try {
      const putResponse = await fetch(requested.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!putResponse.ok) throw new Error("Falha no upload para o storage.");
    } catch {
      setStatus("error");
      setError("Não foi possível enviar o arquivo. Tente novamente.");
      return;
    }

    const confirmed = await confirmUploadAction({
      organizationId,
      storageKey: requested.data.storageKey,
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
    });

    if (!confirmed.ok) {
      setStatus("error");
      setError(confirmed.error.message);
      return;
    }

    setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="file-upload" className="text-sm font-medium text-text-secondary">
        Enviar arquivo
      </label>
      <input
        ref={inputRef}
        id="file-upload"
        type="file"
        disabled={status === "uploading"}
        onChange={handleFileChange}
        className="text-sm text-text-primary"
      />
      {status === "uploading" && <p className="text-xs text-text-secondary">Enviando...</p>}
      {status === "error" && error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
