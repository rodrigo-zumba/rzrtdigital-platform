"use client";

import type { Organization } from "@prisma/client";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { OrganizationStatusBadge } from "@/components/admin/OrganizationStatusBadge";
import { DataTable } from "@/components/tables/DataTable";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });

const columns: ColumnDef<Organization, unknown>[] = [
  {
    accessorKey: "name",
    header: "Cliente",
    cell: ({ row }) => (
      <Link href={`/admin/clientes/${row.original.id}`} className="font-medium text-text-primary hover:text-blue-light">
        {row.original.name}
      </Link>
    ),
  },
  { accessorKey: "slug", header: "Identificador" },
  {
    accessorKey: "document",
    header: "Documento",
    cell: ({ row }) => row.original.document ?? "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <OrganizationStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "createdAt",
    header: "Criado em",
    cell: ({ row }) => dateFormatter.format(row.original.createdAt),
  },
];

export function OrganizationsTable({ organizations }: { organizations: Organization[] }) {
  return <DataTable columns={columns} data={organizations} emptyMessage="Nenhum cliente encontrado." />;
}
