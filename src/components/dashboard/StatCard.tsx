import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value?: ReactNode;
  hint?: string;
  forbidden?: boolean;
  className?: string;
};

export function StatCard({ label, value, hint, forbidden, className }: StatCardProps) {
  return (
    <div className={cn("surface-card flex flex-col gap-1 p-5", className)}>
      <p className="text-sm text-text-secondary">{label}</p>
      {forbidden ? (
        <p className="text-sm text-text-secondary/70">Sem permissão para ver este dado.</p>
      ) : (
        <p className="text-3xl font-semibold text-text-primary">{value}</p>
      )}
      {hint && !forbidden && <p className="text-xs text-text-secondary/70">{hint}</p>}
    </div>
  );
}
