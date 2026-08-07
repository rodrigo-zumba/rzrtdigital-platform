"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Input } from "@/components/ui/Input";
import type { ActionResult } from "@/lib/errors";
import {
  type CreateOrganizationInput,
  createOrganizationSchema,
} from "@/modules/organizations/schemas/organization.schemas";

type OrganizationFormValues = CreateOrganizationInput;

type OrganizationFormProps = {
  defaultValues?: Partial<OrganizationFormValues>;
  onSubmitAction: (prevState: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  hiddenFields?: Record<string, string>;
  submitLabel: string;
};

/**
 * Único form do módulo que usa React Hook Form + zodResolver (CLAUDE.md §2)
 * — os demais forms de Fase 1 (login, convite) são de 1-2 campos e ficaram
 * com useActionState puro; este tem 7 campos e validação client-side ganha.
 * A submissão ainda passa pela Server Action via FormData, mantendo Zod no
 * servidor como fonte da verdade (CLAUDE.md §2).
 */
export function OrganizationForm({ defaultValues, onSubmitAction, hiddenFields, submitLabel }: OrganizationFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      slug: defaultValues?.slug ?? "",
      legalName: defaultValues?.legalName ?? "",
      document: defaultValues?.document ?? "",
      website: defaultValues?.website ?? "",
      phone: defaultValues?.phone ?? "",
      segment: defaultValues?.segment ?? "",
    },
  });

  function onSubmit(values: OrganizationFormValues) {
    setServerError(null);
    const formData = new FormData();
    Object.entries(hiddenFields ?? {}).forEach(([key, value]) => formData.set(key, value));
    Object.entries(values).forEach(([key, value]) => formData.set(key, value ?? ""));

    startTransition(async () => {
      const result = await onSubmitAction(null, formData);
      if (!result.ok) setServerError(result.error.message);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Nome" {...register("name")} error={errors.name?.message} />
        <Input
          label="Identificador (slug)"
          {...register("slug")}
          error={errors.slug?.message}
          placeholder="cliente-exemplo"
        />
        <Input label="Razão social" {...register("legalName")} error={errors.legalName?.message} />
        <Input label="CNPJ" {...register("document")} error={errors.document?.message} />
        <Input label="Site" {...register("website")} error={errors.website?.message} />
        <Input label="Telefone" {...register("phone")} error={errors.phone?.message} />
        <Input label="Segmento" {...register("segment")} error={errors.segment?.message} />
      </div>

      {serverError && (
        <p role="alert" className="text-sm text-danger">
          {serverError}
        </p>
      )}

      <SubmitButtonManual pending={isPending} label={submitLabel} />
    </form>
  );
}

function SubmitButtonManual({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-[44px] w-fit items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue px-5 py-2.5 text-sm font-semibold text-text-primary shadow-[var(--shadow-glow)] transition-all duration-[var(--duration-base)] ease-[var(--ease-standard)] hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:-translate-y-0"
    >
      {pending ? "Salvando..." : label}
    </button>
  );
}
