import type { Metadata } from "next";

import { ProfileForm } from "@/components/forms/ProfileForm";
import { requireRequestContext } from "@/lib/auth";

export const metadata: Metadata = { title: "Perfil" };

export default async function PerfilPage() {
  const ctx = await requireRequestContext();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-semibold text-text-primary">Perfil</h1>
      <ProfileForm name={ctx.name} email={ctx.email} />
    </div>
  );
}
