import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

import { AcceptInvitationForm } from "@/components/forms/AcceptInvitationForm";
import { getClientIp } from "@/lib/security/rate-limit";
import { previewInvitation } from "@/modules/invitations/services/invitation.service";

export const metadata: Metadata = { title: "Aceitar convite" };

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const ip = getClientIp(await headers());
  const preview = await previewInvitation(token, ip);

  if (!preview.valid) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-text-primary">Convite indisponível</h1>
        <p className="text-sm text-text-secondary">{preview.reason}</p>
        <Link href="/login" className="text-sm text-blue-light">
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Você foi convidado</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {preview.organizationName
            ? `Complete seu cadastro para acessar a organização ${preview.organizationName}.`
            : "Complete seu cadastro para acessar o painel."}
        </p>
      </div>

      <AcceptInvitationForm token={token} email={preview.email} />
    </div>
  );
}
