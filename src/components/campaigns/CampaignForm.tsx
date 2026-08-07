"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Input } from "@/components/ui/Input";
import type { ActionResult } from "@/lib/errors";
import { createCampaignAction } from "@/modules/campaigns/actions/create-campaign.action";

const PLATFORM_OPTIONS = [
  { value: "META_ADS", label: "Meta Ads" },
  { value: "GOOGLE_ADS", label: "Google Ads" },
  { value: "TIKTOK_ADS", label: "TikTok Ads" },
  { value: "LINKEDIN_ADS", label: "LinkedIn Ads" },
  { value: "OUTRO", label: "Outro" },
];

export function CampaignForm({ organizationId }: { organizationId: string }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(createCampaignAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="organizationId" value={organizationId} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Nome da campanha" name="name" required className="sm:col-span-2" />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="platform" className="text-sm font-medium text-text-secondary">
            Canal
          </label>
          <select
            id="platform"
            name="platform"
            defaultValue="META_ADS"
            className="min-h-[44px] rounded-[var(--radius-md)] border border-border-strong bg-surface/60 px-3 text-sm text-text-primary outline-none focus-visible:border-blue-light"
          >
            {PLATFORM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <Input label="Objetivo" name="objective" />
        <Input label="Início" name="startDate" type="date" />
        <Input label="Fim" name="endDate" type="date" />
        <Input label="Orçamento (R$)" name="budget" type="number" step="0.01" min="0" />
      </div>

      {state && !state.ok && (
        <p role="alert" className="text-sm text-danger">
          {state.error.message}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-[44px] w-fit items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue px-5 py-2.5 text-sm font-semibold text-text-primary shadow-[var(--shadow-glow)] hover:brightness-110 disabled:opacity-60"
    >
      {pending ? "Criando..." : "Criar campanha"}
    </button>
  );
}
