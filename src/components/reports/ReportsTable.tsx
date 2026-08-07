"use client";

import type { Report } from "@prisma/client";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { ReportStatusBadge } from "@/components/reports/ReportStatusBadge";
import { DataTable } from "@/components/tables/DataTable";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });

export function ReportsTable({ reports, basePath }: { reports: Report[]; basePath: string }) {
  const columns: ColumnDef<Report, unknown>[] = [
    {
      accessorKey: "title",
      header: "Relatório",
      cell: ({ row }) => (
        <Link href={`${basePath}/${row.original.id}`} className="font-medium text-text-primary hover:text-blue-light">
          {row.original.title}
        </Link>
      ),
    },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <ReportStatusBadge status={row.original.status} /> },
    {
      accessorKey: "periodEnd",
      header: "Período até",
      cell: ({ row }) => dateFormatter.format(row.original.periodEnd),
    },
  ];

  return <DataTable columns={columns} data={reports} emptyMessage="Nenhum relatório ainda." />;
}
