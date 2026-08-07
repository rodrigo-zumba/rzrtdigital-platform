"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/Button";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="surface-card flex flex-col items-start gap-3 p-6">
      <p className="text-sm font-medium text-danger">Não foi possível carregar esta página.</p>
      <p className="text-sm text-text-secondary">Tente novamente em alguns instantes.</p>
      <Button onClick={reset} variant="secondary">
        Tentar de novo
      </Button>
    </div>
  );
}
