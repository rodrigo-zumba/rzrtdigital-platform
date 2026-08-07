import Link from "next/link";

import { Button } from "@/components/ui/Button";

export default function AdminNotFound() {
  return (
    <div className="surface-card flex flex-col items-start gap-3 p-6">
      <p className="text-sm font-medium text-text-primary">Página não encontrada.</p>
      <p className="text-sm text-text-secondary">O que você procura não existe ou foi removido.</p>
      <Link href="/admin">
        <Button variant="secondary">Voltar ao painel</Button>
      </Link>
    </div>
  );
}
