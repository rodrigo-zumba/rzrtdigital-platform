import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRequestContext } from "@/lib/auth";
import { getSelectedOrganizationId } from "@/lib/auth/workspace";
import { hasPermission } from "@/lib/permissions";
import { getOrganizationForMember } from "@/modules/organizations/services/organization.service";
import { listOrganizationMembers } from "@/modules/users/services/user.service";

export const metadata: Metadata = { title: "Onboarding" };

function ChecklistItem({ done, label, href }: { done: boolean; label: string; href?: string }) {
  return (
    <li className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-border bg-surface/40 px-4 py-3">
      <span
        className={
          done
            ? "flex h-5 w-5 items-center justify-center rounded-full bg-success/20 text-xs text-success"
            : "flex h-5 w-5 items-center justify-center rounded-full border border-border-strong text-xs text-text-secondary"
        }
      >
        {done ? "✓" : ""}
      </span>
      {href ? (
        <Link href={href} className="text-sm text-text-primary hover:text-blue-light">
          {label}
        </Link>
      ) : (
        <span className="text-sm text-text-primary">{label}</span>
      )}
    </li>
  );
}

export default async function OnboardingPage() {
  const ctx = await requireRequestContext();
  if (ctx.kind !== "CLIENT") return null;

  const organizationId = await getSelectedOrganizationId(ctx);
  if (!organizationId) redirect("/selecionar-workspace");

  const organization = await getOrganizationForMember(ctx, organizationId);
  const canSeeTeam = hasPermission(ctx, "users.read", organizationId);
  const members = canSeeTeam ? await listOrganizationMembers(ctx, organizationId) : [];

  const steps = [
    { done: true, label: "Conta criada e login funcionando" },
    { done: organization.status === "ACTIVE", label: `Organização ativa (status atual: ${organization.status})` },
    ...(canSeeTeam
      ? [{ done: members.length > 1, label: "Convide o resto da sua equipe", href: "/portal/equipe" }]
      : []),
  ];

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Onboarding</h1>
        <p className="mt-1 text-sm text-text-secondary">Organização: {organization.name}</p>
      </div>

      <ul className="flex flex-col gap-2">
        {steps.map((step) => (
          <ChecklistItem key={step.label} done={step.done} label={step.label} href={step.href} />
        ))}
      </ul>
    </div>
  );
}
