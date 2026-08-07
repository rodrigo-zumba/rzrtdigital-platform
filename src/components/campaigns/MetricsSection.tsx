"use client";

import type { CampaignMetric } from "@prisma/client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { ActionResult } from "@/lib/errors";
import { addMetricAction } from "@/modules/campaigns/actions/add-metric.action";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });
const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function MetricsSection({
  organizationId,
  campaignId,
  metrics,
  canWrite,
}: {
  organizationId: string;
  campaignId: string;
  metrics: CampaignMetric[];
  canWrite: boolean;
}) {
  const totals = metrics.reduce(
    (acc, metric) => ({
      leads: acc.leads + metric.leads,
      clicks: acc.clicks + metric.clicks,
      spend: acc.spend + Number(metric.spend),
    }),
    { leads: 0, clicks: 0, spend: 0 },
  );

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-text-secondary">Métricas (últimos 30 registros)</h2>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="surface-card p-4">
          <p className="text-xs text-text-secondary">Leads (total no período)</p>
          <p className="text-xl font-semibold text-text-primary">{totals.leads}</p>
        </div>
        <div className="surface-card p-4">
          <p className="text-xs text-text-secondary">Cliques (total no período)</p>
          <p className="text-xl font-semibold text-text-primary">{totals.clicks}</p>
        </div>
        <div className="surface-card p-4">
          <p className="text-xs text-text-secondary">Investimento (total no período)</p>
          <p className="text-xl font-semibold text-text-primary">{currencyFormatter.format(totals.spend)}</p>
        </div>
      </div>

      {metrics.length === 0 ? (
        <p className="text-sm text-text-secondary">Nenhuma métrica lançada ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-border bg-surface/60 text-text-secondary">
              <tr>
                <th className="px-4 py-2 font-medium">Data</th>
                <th className="px-4 py-2 font-medium">Impressões</th>
                <th className="px-4 py-2 font-medium">Cliques</th>
                <th className="px-4 py-2 font-medium">Leads</th>
                <th className="px-4 py-2 font-medium">Conversões</th>
                <th className="px-4 py-2 font-medium">Investimento</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => (
                <tr key={metric.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2 text-text-secondary">{dateFormatter.format(metric.date)}</td>
                  <td className="px-4 py-2 text-text-primary">{metric.impressions}</td>
                  <td className="px-4 py-2 text-text-primary">{metric.clicks}</td>
                  <td className="px-4 py-2 text-text-primary">{metric.leads}</td>
                  <td className="px-4 py-2 text-text-primary">{metric.conversions}</td>
                  <td className="px-4 py-2 text-text-primary">{currencyFormatter.format(Number(metric.spend))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canWrite && <AddMetricForm organizationId={organizationId} campaignId={campaignId} />}
    </section>
  );
}

function AddMetricForm({ organizationId, campaignId }: { organizationId: string; campaignId: string }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(addMetricAction, null);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="campaignId" value={campaignId} />
      <Field label="Data" name="date" type="date" required />
      <Field label="Impressões" name="impressions" type="number" min="0" defaultValue="0" />
      <Field label="Cliques" name="clicks" type="number" min="0" defaultValue="0" />
      <Field label="Leads" name="leads" type="number" min="0" defaultValue="0" />
      <Field label="Conversões" name="conversions" type="number" min="0" defaultValue="0" />
      <Field label="Investimento (R$)" name="spend" type="number" min="0" step="0.01" defaultValue="0" />
      <SaveButton />
      {state && !state.ok && <span className="text-xs text-danger">{state.error.message}</span>}
    </form>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={rest.name} className="text-xs text-text-secondary">
        {label}
      </label>
      <input
        id={rest.name}
        {...rest}
        className="min-h-[40px] w-32 rounded-[var(--radius-sm)] border border-border-strong bg-surface/60 px-2 text-sm text-text-primary outline-none focus-visible:border-blue-light"
      />
    </div>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-[40px] rounded-[var(--radius-sm)] bg-blue px-4 text-sm font-semibold text-text-primary hover:brightness-110 disabled:opacity-60"
    >
      Lançar
    </button>
  );
}
