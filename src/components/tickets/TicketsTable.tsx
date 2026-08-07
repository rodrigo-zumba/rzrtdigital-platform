"use client";

import type { Ticket } from "@prisma/client";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { DataTable } from "@/components/tables/DataTable";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";

export function TicketsTable({ tickets, basePath }: { tickets: Ticket[]; basePath: string }) {
  const columns: ColumnDef<Ticket, unknown>[] = [
    {
      accessorKey: "number",
      header: "#",
      cell: ({ row }) => (
        <Link href={`${basePath}/${row.original.id}`} className="font-medium text-text-primary hover:text-blue-light">
          #{row.original.number}
        </Link>
      ),
    },
    { accessorKey: "subject", header: "Assunto" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <TicketStatusBadge status={row.original.status} /> },
  ];

  return <DataTable columns={columns} data={tickets} emptyMessage="Nenhum chamado aberto ainda." />;
}
